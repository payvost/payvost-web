
'use server';

import * as OneSignal from '@onesignal/node-onesignal';

// --- OneSignal Client Initialization ---
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '';
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || '';

const configuration = OneSignal.createConfiguration({
    userKey: ONESIGNAL_API_KEY,
    appKey: ONESIGNAL_APP_ID,
});
const client = new OneSignal.DefaultApi(configuration);


interface PaymentRequestEmail {
    to: string;
    requesterName: string;
    amount: number;
    currency: string;
    description: string;
    paymentLink: string;
}


// --- Email Sending Functions ---

/**
 * Sends a welcome email to a newly verified user.
 * @param toEmail The recipient's email address.
 * @param toName The recipient's name.
 */
export async function sendVerificationWelcomeEmail(toEmail: string, toName: string) {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_email_tokens = [toEmail];
    notification.email_subject = "Welcome to Payvost!";
    
    // Using a more visually appealing HTML template for the welcome email
    notification.email_body = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #3CB371; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Welcome to Payvost!</h1>
            </div>
            <div style="padding: 20px;">
                <h2 style="font-size: 20px; color: #3CB371;">Hello ${toName},</h2>
                <p>On behalf of the entire team, I'd like to extend a warm welcome to Payvost. We're thrilled to have you with us!</p>
                <p>Your account has been successfully verified, and you now have full access to our global remittance platform. We're committed to providing you with a fast, secure, and seamless experience for all your international transactions.</p>
                <p>If you have any questions, our support team is always ready to assist you. Welcome aboard!</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #3CB371; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">Go to Your Dashboard</a>
                </div>
                <p style="margin-top: 30px; font-size: 14px;">Best regards,</p>
                <p style="font-size: 14px; font-weight: bold; margin: 0;">Alice Johnson</p>
                <p style="font-size: 12px; color: #888; margin: 0;">CEO, Payvost</p>
            </div>
            <div style="background-color: #f7f7f7; color: #888; padding: 15px; text-align: center; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Payvost Inc. All Rights Reserved.
            </div>
        </div>
    `;

    try {
        const response = await client.createNotification(notification);
        console.log('Welcome email sent successfully:', response.id);
        return { success: true, id: response.id };
    } catch (e: any) {
        console.error('Error sending welcome email with OneSignal:', e.body || e);
        throw new Error('Failed to send welcome email.');
    }
}


export async function sendPaymentRequestEmail(details: PaymentRequestEmail) {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_email_tokens = [details.to];
    notification.email_subject = `Payment Request from ${details.requesterName}`;
    notification.email_body = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>You've Received a Payment Request</h2>
            <p>Hello,</p>
            <p>${details.requesterName} is requesting a payment of <strong>${details.amount} ${details.currency}</strong> for: "${details.description}".</p>
            <p>
                <a href="${details.paymentLink}" style="background-color: #3CB371; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    Pay Securely Now
                </a>
            </p>
            <p style="font-size: 12px; color: #888;">If you were not expecting this, please ignore this email.</p>
        </div>
    `;

    try {
        const response = await client.createNotification(notification);
        console.log('Payment request email sent successfully to', details.to, 'with ID:', response.id);
        return { success: true };
    } catch (e: any) {
        console.error('Error sending payment request email with OneSignal:', e.body || e);
        throw new Error('Failed to send payment request email.');
    }
}
