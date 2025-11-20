"use strict";
/**
 * Firebase Cloud Messaging (FCM) Backend Service
 * Sends push notifications using firebase-admin
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = sendPushNotification;
exports.sendMulticastNotification = sendMulticastNotification;
exports.sendTopicNotification = sendTopicNotification;
exports.subscribeToTopic = subscribeToTopic;
exports.unsubscribeFromTopic = unsubscribeFromTopic;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
/**
 * Send push notification to a single device
 */
async function sendPushNotification(params) {
    const { token, title, body, data, imageUrl, clickAction } = params;
    try {
        const message = {
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
        const messageId = await firebase_admin_1.default.messaging().send(message);
        console.log('✅ Push notification sent successfully:', messageId);
        return { success: true, messageId };
    }
    catch (error) {
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
async function sendMulticastNotification(params) {
    const { tokens, title, body, data, imageUrl, clickAction } = params;
    if (tokens.length === 0) {
        return { success: false, successCount: 0, failureCount: 0, error: 'No tokens provided' };
    }
    try {
        const message = {
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
        const response = await firebase_admin_1.default.messaging().sendEachForMulticast(message);
        console.log(`✅ Multicast notification sent: ${response.successCount}/${tokens.length} successful`);
        return {
            success: response.successCount > 0,
            successCount: response.successCount,
            failureCount: response.failureCount,
            responses: response,
        };
    }
    catch (error) {
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
async function sendTopicNotification(params) {
    const { topic, title, body, data, imageUrl, clickAction } = params;
    try {
        const message = {
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
        const messageId = await firebase_admin_1.default.messaging().send(message);
        console.log('✅ Topic notification sent successfully:', messageId);
        return { success: true, messageId };
    }
    catch (error) {
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
async function subscribeToTopic(tokens, topic) {
    try {
        await firebase_admin_1.default.messaging().subscribeToTopic(tokens, topic);
        console.log(`✅ ${tokens.length} devices subscribed to topic: ${topic}`);
        return { success: true };
    }
    catch (error) {
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
async function unsubscribeFromTopic(tokens, topic) {
    try {
        await firebase_admin_1.default.messaging().unsubscribeFromTopic(tokens, topic);
        console.log(`✅ ${tokens.length} devices unsubscribed from topic: ${topic}`);
        return { success: true };
    }
    catch (error) {
        console.error('❌ Error unsubscribing from topic:', error);
        return {
            success: false,
            error: error.message || 'Failed to unsubscribe from topic',
        };
    }
}
