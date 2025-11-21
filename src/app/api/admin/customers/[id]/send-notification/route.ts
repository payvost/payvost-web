import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase-admin';
import { verifySessionCookie, isAdmin, logAdminAccess } from '@/lib/auth-helpers';
import { sendUnifiedNotification } from '@/lib/unified-notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authorization: verify session and admin role
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifySessionCookie(sessionCookie);
    const admin = await isAdmin(decoded.uid);
    
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;
    const { title, message, type } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!title || !message) {
      return NextResponse.json({ 
        error: 'Title and message are required' 
      }, { status: 400 });
    }

    // Get user document to verify user exists
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`📧 Sending notification to user ${userId}`);

    // Send notification via all available channels
    const result = await sendUnifiedNotification({
      userId,
      title,
      body: message,
      type: type || 'ADMIN_NOTIFICATION',
      data: {
        source: 'admin',
        adminId: decoded.uid,
      },
      emailTemplate: 'account_welcome', // Using a generic template
      emailVariables: {
        message,
      },
    });

    // Log the action
    await logAdminAccess(decoded.uid, 'SEND_NOTIFICATION', {
      targetUserId: userId,
      title,
      message,
      notificationType: type || 'ADMIN_NOTIFICATION',
      results: result,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    console.log(`✅ Notification sent successfully to user: ${userId}`);

    const successCount = [result.push, result.email, result.inApp].filter(r => r.success).length;
    const channelCount = [result.push, result.email, result.inApp].length;

    return NextResponse.json({ 
      success: true, 
      message: `Notification sent via ${successCount} of ${channelCount} channels`,
      results: result,
    });
  } catch (error: any) {
    console.error('❌ Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification', details: error.message },
      { status: 500 }
    );
  }
}

