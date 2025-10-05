import * as OneSignal from '@onesignal/node-onesignal';

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID!;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY!;

const configuration = OneSignal.createConfiguration({
  appKey: ONESIGNAL_API_KEY,
});
const client = new OneSignal.DefaultApi(configuration);

export async function sendVerificationWelcomeEmail(toEmail: string, toName: string) {
  const notification = new OneSignal.Notification();
  notification.app_id = ONESIGNAL_APP_ID;
  notification.include_email_tokens = [toEmail];
  notification.template_id = "e93c127c-9194-4799-b545-4a91cfc3226b"; // Your OneSignal template

  try {
    const response = await client.createNotification(notification);
    console.log('✅ Welcome email sent:', response.id);
  } catch (error: any) {
    console.error('❌ Failed to send OneSignal email:', error.body || error);
  }
}
