'use server';
/**
 * @fileOverview A conversational AI agent for user support.
 *
 * - chat - A function that handles a single turn in a conversation.
 */

import { ai } from '@/ai/genkit';
import { type ChatInput, ChatInputSchema, type ChatOutput, ChatOutputSchema } from '@/types/chat';

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return supportChatFlow(input);
}

const supportChatFlow = ai.defineFlow(
  {
    name: 'supportChatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { message, history } = input;

    const llm = (ai as any).getGenerator('googleai/gemini-2.0-flash');

    const response = await llm.generate({
      history: history,
      prompt: message,
      system: `You are a friendly and helpful customer support agent for Payvost, a global remittance service.
      Your goal is to assist users with their questions about the platform.
      Be concise and clear in your answers.
      You cannot perform any actions on their account. You can only provide information.
      If you don't know the answer to something, say so.
      `,
    });

    return {
      message: response.text,
    };
  }
);
