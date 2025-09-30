'use server';

import { generateNotification, type GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { chat as supportChat } from '@/ai/flows/support-chat-flow';
import type { ChatInput } from '@/types/chat';


export async function getAdaptiveNotification(input: GenerateNotificationInput) {
  try {
    const result = await generateNotification(input);
    return { success: true, message: result.notificationMessage };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to generate notification.' };
  }
}

export async function getAiSupportResponse(input: ChatInput) {
    try {
        const result = await supportChat(input);
        return { success: true, message: result.message };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Sorry, I encountered an error. Please try again.' };
    }
}
