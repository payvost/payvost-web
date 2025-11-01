import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase-admin';
import { verifySessionCookie, isAdmin } from '@/lib/auth-helpers';

export async function GET() {
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

    console.log('🔍 Fetching payment requests...');

    const paymentLinks: any[] = [];

    // Check for payment requests collection (primary)
    try {
      const paymentRequestsSnapshot = await db.collection('paymentRequests').get();
      
      paymentRequestsSnapshot.forEach((doc) => {
        const data = doc.data();
        paymentLinks.push({
          id: doc.id,
          title: data.description || data.title || data.name || 'Payment Request',
          description: data.description || '',
          status: data.status || 'Active',
          clicks: data.clicks || data.views || 0,
          paid: data.paid || data.successfulPayments || 0,
          amountReceived: data.status === 'Paid' || data.status === 'Completed' ? 
                          parseFloat(data.numericAmount || data.amount || 0) : 0,
          currency: data.currency || 'USD',
          created: data.createdAt?.toDate?.() || 
                   (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000) : null) ||
                   (typeof data.createdAt === 'string' ? new Date(data.createdAt) : 
                   data.date ? new Date(data.date) : new Date()),
          publicUrl: data.link || data.publicUrl,
          type: 'payment_request',
          amount: data.amount || `${data.currency || 'USD'} ${data.numericAmount || 0}`,
        });
      });
      
      console.log(`✅ Found ${paymentRequestsSnapshot.size} payment requests`);
    } catch (err) {
      console.log('No paymentRequests collection found');
    }

    // Check for dedicated payment links collection
    try {
      const paymentLinksSnapshot = await db.collection('paymentLinks').get();
      
      paymentLinksSnapshot.forEach((doc) => {
        const data = doc.data();
        paymentLinks.push({
          id: doc.id,
          title: data.title || data.name || 'Untitled',
          status: data.status || (data.isActive ? 'Active' : 'Inactive'),
          clicks: data.clicks || data.views || 0,
          paid: data.paid || data.successfulPayments || 0,
          amountReceived: parseFloat(data.amountReceived || data.totalReceived || 0),
          currency: data.currency || 'USD',
          created: data.createdAt?.toDate?.() || 
                   (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000) : null) ||
                   (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date()),
          publicUrl: data.link || data.publicUrl,
          type: 'payment_link',
        });
      });
    } catch (err) {
      console.log('No paymentLinks collection found');
    }

    // Sort by creation date (newest first)
    paymentLinks.sort((a, b) => b.created.getTime() - a.created.getTime());

    // Calculate stats
    const totalRevenue = paymentLinks.reduce((sum, link) => sum + link.amountReceived, 0);
    const activeLinks = paymentLinks.filter(link => 
      link.status === 'Active' || link.status === 'Pending'
    ).length;
    
    const totalClicks = paymentLinks.reduce((sum, link) => sum + link.clicks, 0);
    const totalPaid = paymentLinks.reduce((sum, link) => sum + link.paid, 0);
    const conversionRate = totalClicks > 0 ? (totalPaid / totalClicks) * 100 : 0;

    console.log(`✅ Found ${paymentLinks.length} payment links`);
    console.log(`   Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`   Active Links: ${activeLinks}`);
    console.log(`   Conversion Rate: ${conversionRate.toFixed(1)}%`);

    return NextResponse.json({
      links: paymentLinks,
      stats: {
        totalRevenue,
        activeLinks,
        conversionRate,
        totalClicks,
        totalPaid,
        totalLinks: paymentLinks.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching payment links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment links', details: error.message },
      { status: 500 }
    );
  }
}
