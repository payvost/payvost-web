import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth, admin } from '@/lib/firebase-admin';
import nodemailer from 'nodemailer';

// Email configuration - only create transporter if credentials are available
let emailTransporter: nodemailer.Transporter | null = null;

function getEmailTransporter(): nodemailer.Transporter {
  if (emailTransporter) {
    return emailTransporter;
  }

  const mailgunLogin = process.env.MAILGUN_SMTP_LOGIN;
  const mailgunPassword = process.env.MAILGUN_SMTP_PASSWORD;

  if (!mailgunLogin || !mailgunPassword) {
    throw new Error('Mailgun SMTP credentials are not configured. Please set MAILGUN_SMTP_LOGIN and MAILGUN_SMTP_PASSWORD environment variables.');
  }

  emailTransporter = nodemailer.createTransport({
    host: process.env.MAILGUN_SMTP_HOST || 'smtp.mailgun.org',
    port: parseInt(process.env.MAILGUN_SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: mailgunLogin,
      pass: mailgunPassword,
    },
  });

  return emailTransporter;
}

const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || 'no-reply@payvost.com';

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/send-login-code
 * Sends a verification code to the user's email for login
 * 
 * @deprecated This endpoint is no longer used. Login now uses Firebase email verification links instead.
 * Kept for potential future use when Mailgun account is reactivated.
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token to get user info
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code in Firestore with expiration
    const FieldValue = admin.firestore.FieldValue;
    await adminDb.collection('loginCodes').doc(uid).set({
      code,
      email,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      createdAt: admin.firestore.Timestamp.fromDate(new Date()),
      attempts: 0,
    });

    // Get user's name from Firestore if available
    let userName = 'User';
    try {
      const userDoc = await adminDb.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        userName = userData?.displayName || userData?.name || userData?.firstName || 'User';
      }
    } catch (err) {
      // Continue with default name
      console.warn('Could not fetch user name:', err);
    }

    // Send email with verification code
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Login Verification Code</h2>
          <p style="color: #4b5563; font-size: 16px;">Hello ${userName},</p>
          <p style="color: #4b5563; font-size: 16px;">Your login verification code is:</p>
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #3b82f6; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${code}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Payvost. All rights reserved.</p>
        </div>
      </div>
    `;

    // Get email transporter and send email
    const transporter = getEmailTransporter();
    await transporter.sendMail({
      from: `Payvost <${MAILGUN_FROM_EMAIL}>`,
      to: email,
      subject: 'Your Payvost Login Verification Code',
      html: emailHTML,
    });

    console.log(`✅ Login verification code sent to ${email} for user ${uid}`);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
    });

  } catch (error: any) {
    console.error('❌ Error sending login code:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send verification code';
    let statusCode = 500;
    
    if (error.message?.includes('Mailgun SMTP credentials')) {
      errorMessage = 'Email service is not configured. Please contact support.';
      statusCode = 503; // Service Unavailable
    } else if (error.message?.includes('ID token')) {
      errorMessage = 'Invalid authentication token';
      statusCode = 401;
    } else if (error.code === 'auth/invalid-id-token') {
      errorMessage = 'Invalid or expired authentication token';
      statusCode = 401;
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: statusCode }
    );
  }
}

