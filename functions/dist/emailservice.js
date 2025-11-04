"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationWelcomeEmail = sendVerificationWelcomeEmail;
/**
 * Email Service using Nodemailer/Mailgun
 * Replaced OneSignal with direct SMTP
 */
const notificationService_1 = require("./services/notificationService");
async function sendVerificationWelcomeEmail(toEmail, toName) {
    try {
        const result = await (0, notificationService_1.sendKycStatusNotification)({
            email: toEmail,
            name: toName,
            status: 'approved',
            nextSteps: 'You now have full access to all Payvost features.',
        });
        if (result.success) {
            console.log('✅ Welcome email sent:', result.messageId);
        }
        else {
            console.error('❌ Failed to send email:', result.error);
        }
    }
    catch (error) {
        console.error('❌ Failed to send email:', error.message || error);
    }
}
