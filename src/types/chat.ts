import { z } from 'genkit';

/**
 * @fileOverview Defines the types and Zod schemas for the AI support chat.
 *
 * - ChatInputSchema: The Zod schema for the chat input.
 * - ChatInput: The TypeScript type for the chat input.
 * - ChatOutputSchema: The Zod schema for the chat output.
 * - ChatOutput: The TypeScript type for the chat output.
 */

export const ChatInputSchema = z.object({
  message: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() })),
  })).optional(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.object({
  message: z.string(),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

// Enhanced chat types for professional chat widget
export type MessageType = 
  | 'text' 
  | 'file' 
  | 'card' 
  | 'button' 
  | 'list' 
  | 'system' 
  | 'ai_response';

export interface RichMessageMetadata {
  // For cards
  card?: {
    title: string;
    subtitle?: string;
    image?: string;
    buttons?: Array<{ label: string; action: string; value?: any }>;
  };
  
  // For buttons
  buttons?: Array<{ label: string; action: string; value?: any }>;
  
  // For lists
  list?: Array<{ title: string; subtitle?: string; action?: string }>;
  
  // For files
  file?: {
    url: string;
    name: string;
    type: string;
    size: number;
    thumbnail?: string;
  };
  
  // For attachments array
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
    thumbnail?: string;
  }>;
}

export interface EnhancedChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  type: MessageType;
  isRead: boolean;
  readAt?: string;
  readBy?: string;
  attachments?: RichMessageMetadata['attachments'];
  metadata?: RichMessageMetadata;
  reactions?: Record<string, string[]>; // emoji -> userIds[]
  createdAt: string;
  updatedAt?: string;
}