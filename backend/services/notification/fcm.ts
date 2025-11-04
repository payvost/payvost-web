/**
 * Firebase Cloud Messaging (FCM) Backend Service
 * Sends push notifications using firebase-admin
 */

import admin from 'firebase-admin';
import type { Message, MulticastMessage, BatchResponse } from 'firebase-admin/messaging';

/**
 * Send push notification to a single device
 */
export async function sendPushNotification(params: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { token, title, body, data, imageUrl, clickAction } = params;

  try {
    const message: Message = {
      token,
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: data || {},
      webpush: {
        fcmOptions: {
          link: clickAction || '/dashboard/notifications',
        },
        notification: {
          icon: '/payvost.png',
          badge: '/payvost.png',
          requireInteraction: true,
          tag: data?.type || 'general',
        },
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'payvost_notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const messageId = await admin.messaging().send(message);
    
    console.log('✅ Push notification sent successfully:', messageId);
    return { success: true, messageId };
  } catch (error: any) {
    console.error('❌ Error sending push notification:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send push notification' 
    };
  }
}

/**
 * Send push notification to multiple devices
 */
export async function sendMulticastNotification(params: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}): Promise<{ 
  success: boolean; 
  successCount: number;
  failureCount: number;
  responses?: BatchResponse;
  error?: string;
}> {
  const { tokens, title, body, data, imageUrl, clickAction } = params;

  if (tokens.length === 0) {
    return { success: false, successCount: 0, failureCount: 0, error: 'No tokens provided' };
  }

  try {
    const message: MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: data || {},
      webpush: {
        fcmOptions: {
          link: clickAction || '/dashboard/notifications',
        },
        notification: {
          icon: '/payvost.png',
          badge: '/payvost.png',
          requireInteraction: true,
          tag: data?.type || 'general',
        },
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'payvost_notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`✅ Multicast notification sent: ${response.successCount}/${tokens.length} successful`);
    
    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response,
    };
  } catch (error: any) {
    console.error('❌ Error sending multicast notification:', error);
    return {
      success: false,
      successCount: 0,
      failureCount: tokens.length,
      error: error.message || 'Failed to send multicast notification',
    };
  }
}

/**
 * Send push notification to a topic
 */
export async function sendTopicNotification(params: {
  topic: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { topic, title, body, data, imageUrl, clickAction } = params;

  try {
    const message: Message = {
      topic,
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: data || {},
      webpush: {
        fcmOptions: {
          link: clickAction || '/dashboard/notifications',
        },
        notification: {
          icon: '/payvost.png',
          badge: '/payvost.png',
          requireInteraction: true,
          tag: data?.type || 'general',
        },
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'payvost_notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const messageId = await admin.messaging().send(message);
    
    console.log('✅ Topic notification sent successfully:', messageId);
    return { success: true, messageId };
  } catch (error: any) {
    console.error('❌ Error sending topic notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send topic notification',
    };
  }
}

/**
 * Subscribe device tokens to a topic
 */
export async function subscribeToTopic(
  tokens: string[],
  topic: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await admin.messaging().subscribeToTopic(tokens, topic);
    console.log(`✅ ${tokens.length} devices subscribed to topic: ${topic}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error subscribing to topic:', error);
    return {
      success: false,
      error: error.message || 'Failed to subscribe to topic',
    };
  }
}

/**
 * Unsubscribe device tokens from a topic
 */
export async function unsubscribeFromTopic(
  tokens: string[],
  topic: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await admin.messaging().unsubscribeFromTopic(tokens, topic);
    console.log(`✅ ${tokens.length} devices unsubscribed from topic: ${topic}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error unsubscribing from topic:', error);
    return {
      success: false,
      error: error.message || 'Failed to unsubscribe from topic',
    };
  }
}
