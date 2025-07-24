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
