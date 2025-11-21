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

    console.log('🔍 Fetching payment links, donations, and events...');

    const paymentLinks: any[] = [];
    const donations: any[] = [];
    const events: any[] = [];

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
          created: (() => {
            const date = data.createdAt?.toDate?.() || 
                        (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000) : null) ||
                        (typeof data.createdAt === 'string' ? new Date(data.createdAt) : 
                        data.date ? new Date(data.date) : new Date());
            return date instanceof Date ? date.toISOString() : new Date().toISOString();
          })(),
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
          created: (() => {
            const date = data.createdAt?.toDate?.() || 
                        (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000) : null) ||
                        (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date());
            return date instanceof Date ? date.toISOString() : new Date().toISOString();
          })(),
          publicUrl: data.link || data.publicUrl,
          type: 'payment_link',
        });
      });
    } catch (err) {
      console.log('No paymentLinks collection found');
    }

    // Fetch donations
    try {
      const donationsSnapshot = await db.collection('donations').get();
      
      donationsSnapshot.forEach((doc) => {
        const data = doc.data();
        donations.push({
          id: doc.id,
          title: data.title || 'Untitled Donation',
          description: data.description || '',
          status: data.status || 'Active',
          clicks: data.views || 0,
          paid: data.contributions?.length || 0,
          amountReceived: parseFloat(data.raisedAmount || 0),
          currency: data.currency || 'USD',
          goal: parseFloat(data.goal || 0),
          created: (() => {
            const date = data.createdAt?.toDate?.() || 
                        (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000) : null) ||
                        (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date());
            return date instanceof Date ? date.toISOString() : new Date().toISOString();
          })(),
          publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.payvost.com'}/donate/${doc.id}`,
          type: 'donation',
          userId: data.userId,
        });
      });
      
      console.log(`✅ Found ${donationsSnapshot.size} donations`);
    } catch (err) {
      console.log('No donations collection found');
    }

    // Fetch events
    try {
      const eventsSnapshot = await db.collection('events').get();
      
      for (const doc of eventsSnapshot.docs) {
        const data = doc.data();
        
        // Get ticket sales count
        let ticketsSold = 0;
        let totalRevenue = 0;
        try {
          const ticketsSnapshot = await doc.ref.collection('tickets').get();
          ticketsSnapshot.forEach((ticketDoc) => {
            const ticketData = ticketDoc.data();
            if (ticketData.status === 'purchased' || ticketData.status === 'paid') {
              ticketsSold += ticketData.quantity || 1;
              totalRevenue += parseFloat(ticketData.amount || 0);
            }
          });
        } catch (err) {
          console.log(`Could not fetch tickets for event ${doc.id}`);
        }
        
        events.push({
          id: doc.id,
          title: data.title || data.name || 'Untitled Event',
          description: data.description || '',
          status: data.status || 'Active',
          clicks: data.views || 0,
          paid: ticketsSold,
          amountReceived: totalRevenue,
          currency: data.currency || 'USD',
          totalTickets: data.tickets?.reduce((sum: number, t: any) => sum + (t.quantity || 0), 0) || 0,
          created: (() => {
            const date = data.createdAt?.toDate?.() || 
                        (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000) : null) ||
                        (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date());
            return date instanceof Date ? date.toISOString() : new Date().toISOString();
          })(),
          publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.payvost.com'}/event/${doc.id}`,
          type: 'event',
          userId: data.userId,
          eventDate: data.eventDate || null,
        });
      }
      
      console.log(`✅ Found ${eventsSnapshot.size} events`);
    } catch (err) {
      console.log('No events collection found');
    }

    // Combine all items
    const allItems = [...paymentLinks, ...donations, ...events];

    // Sort by creation date (newest first)
    allItems.sort((a, b) => {
      const dateA = typeof a.created === 'string' ? new Date(a.created).getTime() : (a.created?.getTime?.() || 0);
      const dateB = typeof b.created === 'string' ? new Date(b.created).getTime() : (b.created?.getTime?.() || 0);
      return dateB - dateA;
    });

    // Calculate stats
    const totalRevenue = allItems.reduce((sum, item) => sum + item.amountReceived, 0);
    const activeLinks = allItems.filter(item => 
      item.status === 'Active' || item.status === 'Pending'
    ).length;
    
    const totalClicks = allItems.reduce((sum, item) => sum + item.clicks, 0);
    const totalPaid = allItems.reduce((sum, item) => sum + item.paid, 0);
    const conversionRate = totalClicks > 0 ? (totalPaid / totalClicks) * 100 : 0;

    // Type-specific counts
    const paymentLinksCount = paymentLinks.length;
    const donationsCount = donations.length;
    const eventsCount = events.length;

    console.log(`✅ Found ${allItems.length} total items`);
    console.log(`   Payment Links: ${paymentLinksCount}`);
    console.log(`   Donations: ${donationsCount}`);
    console.log(`   Events: ${eventsCount}`);
    console.log(`   Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`   Active Items: ${activeLinks}`);
    console.log(`   Conversion Rate: ${conversionRate.toFixed(1)}%`);

    return NextResponse.json({
      links: allItems,
      stats: {
        totalRevenue,
        activeLinks,
        conversionRate,
        totalClicks,
        totalPaid,
        totalLinks: allItems.length,
        paymentLinksCount,
        donationsCount,
        eventsCount,
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
