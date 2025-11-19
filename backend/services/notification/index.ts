// Notification Service
// Handles email, push, and SMS notifications
import { initTwilio } from './twilio';

// Initialize Twilio when module loads
initTwilio();

export { default as notificationRoutes } from './routes';

