import { prisma } from '../../common/prisma';
import { logger } from '../../common/logger';
import OpenAI from 'openai';

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  logger.warn('OpenAI API key not configured. AI chat features will be disabled.');
}

interface ChatContext {
  userId: string;
  sessionId: string;
  messageHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  userAccount?: any;
  recentTickets?: any[];
}

interface MessageAnalysis {
  intent: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  shouldEscalate: boolean;
}

export class AIOrchestrator {
  async processMessage(
    sessionId: string,
    userId: string,
    message: string
  ): Promise<string> {
    try {
      // Get chat context
      const context = await this.getChatContext(sessionId, userId);

      // Analyze intent and sentiment
      const analysis = await this.analyzeMessage(message, context);

      // Check if escalation is needed
      if (analysis.shouldEscalate) {
        await this.escalateToHuman(sessionId, userId, analysis);
        return "I'm connecting you with a support agent who can better assist you. Please hold on for a moment.";
      }

      // Generate AI response with context
      const aiResponse = await this.generateAIResponse(message, context);

      // Save AI response to database
      await prisma.chatMessage.create({
        data: {
          sessionId,
          senderId: 'AI_ASSISTANT', // Special ID for AI
          content: aiResponse,
          type: 'ai_response',
          metadata: {
            intent: analysis.intent,
            sentiment: analysis.sentiment,
            confidence: analysis.confidence,
          },
        },
      });

      // Broadcast AI response via WebSocket (handled by caller)
      return aiResponse;
    } catch (error: any) {
      logger.error({ err: error, sessionId, userId }, 'AI processing failed');
      throw error;
    }
  }

  private async getChatContext(
    sessionId: string,
    userId: string
  ): Promise<ChatContext> {
    // Get message history
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20, // Last 20 messages
    });

    // Get user account info
    const userAccount = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        twoFactorPhone: true,
      },
    });

    // Get recent tickets
    const recentTickets = await prisma.supportTicket.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    });

    return {
      userId,
      sessionId,
      messageHistory: messages.map((msg: { senderId: string; content: string }) => ({
        role: msg.senderId === userId ? 'user' : msg.senderId === 'AI_ASSISTANT' ? 'assistant' : 'user',
        content: msg.content,
      })),
      userAccount,
      recentTickets,
    };
  }

  private async analyzeMessage(
    message: string,
    context: ChatContext
  ): Promise<MessageAnalysis> {
    // Use OpenAI to analyze message intent and sentiment
    if (!openai) {
      logger.warn('OpenAI not available, using fallback analysis');
      return this.fallbackAnalysis(message, context);
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze the following customer message and determine:
1. Intent (e.g., "account_issue", "payment_question", "technical_support", "general_inquiry", "complaint", "escalation_request")
2. Sentiment ("positive", "neutral", "negative")
3. Whether this should be escalated to a human agent (true if: explicit request for human, complaint, negative sentiment with complex issue, or multiple unresolved tickets)

Respond in JSON format: {"intent": "...", "sentiment": "...", "shouldEscalate": boolean, "confidence": 0.0-1.0}`,
          },
          {
            role: 'user',
            content: `Message: "${message}"
            
Context: User has ${context.recentTickets?.length || 0} recent tickets.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const analysisText = completion.choices[0]?.message?.content || '{}';
      const analysis = JSON.parse(analysisText);

      return {
        intent: analysis.intent || 'general_inquiry',
        sentiment: analysis.sentiment || 'neutral',
        confidence: analysis.confidence || 0.7,
        shouldEscalate: analysis.shouldEscalate || false,
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to analyze message with OpenAI');
      // Fallback to simple keyword-based analysis
      return this.fallbackAnalysis(message, context);
    }
  }

  private fallbackAnalysis(
    message: string,
    context: ChatContext
  ): MessageAnalysis {
    const lowerMessage = message.toLowerCase();
    
    const negativeKeywords = ['frustrated', 'angry', 'disappointed', 'problem', 'issue', 'error', 'broken', 'not working'];
    const escalationKeywords = ['speak to human', 'agent', 'manager', 'complaint', 'supervisor', 'representative'];
    
    const hasNegativeSentiment = negativeKeywords.some(kw => lowerMessage.includes(kw));
    const hasEscalationKeywords = escalationKeywords.some(kw => lowerMessage.includes(kw));
    const hasMultipleTickets = Boolean(hasNegativeSentiment && context.recentTickets && context.recentTickets.length > 2);
    const shouldEscalate = hasEscalationKeywords || hasMultipleTickets;

    return {
      intent: 'general_inquiry',
      sentiment: hasNegativeSentiment ? 'negative' : 'neutral',
      confidence: 0.6,
      shouldEscalate: Boolean(shouldEscalate),
    };
  }

  private async generateAIResponse(
    message: string,
    context: ChatContext
  ): Promise<string> {
    if (!openai) {
      logger.warn('OpenAI not available, returning fallback response');
      return "I'm currently unable to process AI responses. Please ask to speak with a human agent for assistance.";
    }

    try {
      const systemPrompt = `You are a friendly and helpful customer support assistant for Payvost, a global remittance service.
Your goal is to assist users with their questions about the platform.

Guidelines:
- Be concise, clear, and professional
- You cannot perform actions on their account (no transfers, no account changes)
- You can only provide information and guidance
- If you don't know the answer, say so and offer to connect them with a human agent
- Be empathetic and understanding

User Context:
- Name: ${context.userAccount?.name || 'Customer'}
- Email: ${context.userAccount?.email || 'N/A'}
- Recent Tickets: ${context.recentTickets?.length || 0}

${context.recentTickets && context.recentTickets.length > 0 
  ? `Recent ticket subjects: ${context.recentTickets.map(t => t.subject).join(', ')}`
  : ''}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...context.messageHistory.slice(-10), // Last 10 messages for context
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || 'I apologize, but I encountered an error. Please try again or ask to speak with a human agent.';
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to generate AI response');
      throw new Error('AI service temporarily unavailable');
    }
  }

  private async escalateToHuman(
    sessionId: string,
    userId: string,
    analysis: MessageAnalysis
  ) {
    try {
      // Create support ticket
      const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      const ticket = await prisma.supportTicket.create({
        data: {
          ticketNumber,
          subject: 'Chat Escalation - AI Assistant',
          description: `Escalated from chat session ${sessionId}.\n\nIntent: ${analysis.intent}\nSentiment: ${analysis.sentiment}\nConfidence: ${analysis.confidence}`,
          category: 'CHAT_ESCALATION',
          priority: analysis.sentiment === 'negative' ? 'HIGH' : 'MEDIUM',
          customerId: userId,
          status: 'OPEN',
          metadata: {
            sessionId,
            analysis,
            escalatedFrom: 'AI_CHAT',
          } as any,
        },
      });

      // Update chat session to request agent assignment
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          status: 'WAITING',
          metadata: {
            escalated: true,
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            reason: analysis.intent,
            timestamp: new Date().toISOString(),
          },
        },
      });

      logger.info({ sessionId, ticketId: ticket.id }, 'Chat escalated to human agent');
    } catch (error: any) {
      logger.error({ err: error, sessionId }, 'Failed to escalate chat');
      throw error;
    }
  }
}

