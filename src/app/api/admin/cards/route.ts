import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase-admin';
import { verifySessionCookie, isAdmin } from '@/lib/auth-helpers';

export async function GET(request: Request) {
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

    console.log('🔍 Fetching all cards...');

    const allCards: any[] = [];

    // Fetch cards from all users
    try {
      const usersSnapshot = await db.collection('users').get();
      
      for (const userDoc of usersSnapshot.docs) {
        try {
          // Check if user has cards array in their document
          const userData = userDoc.data();
          if (userData.cards && Array.isArray(userData.cards)) {
            userData.cards.forEach((card: any) => {
              allCards.push({
                ...card,
                id: card.id || `vc_${Date.now()}_${Math.random()}`,
                userId: userDoc.id,
                userName: userData.name || userData.displayName || 'Unknown User',
                userEmail: userData.email || 'No email',
              });
            });
          }

          // Also check cards subcollection if it exists
          const cardsSnapshot = await userDoc.ref.collection('cards').get();
          cardsSnapshot.forEach((cardDoc) => {
            const cardData = cardDoc.data();
            allCards.push({
              ...cardData,
              id: cardDoc.id,
              userId: userDoc.id,
              userName: userData.name || userData.displayName || 'Unknown User',
              userEmail: userData.email || 'No email',
            });
          });
        } catch (err) {
          console.log(`No cards for user ${userDoc.id}`);
        }
      }
    } catch (err) {
      console.log('Error fetching cards:', err);
    }

    // Calculate stats
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const totalActive = allCards.filter(c => c.status === 'active').length;
    const frozenCount = allCards.filter(c => c.status === 'frozen').length;
    const terminatedCount = allCards.filter(c => c.status === 'terminated').length;
    
    // Calculate total spending (sum of balances for active cards)
    const totalSpending30d = allCards
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + (parseFloat(c.balance || 0)), 0);
    
    // Mock fraud blocks (should come from fraud detection service)
    const fraudBlocks24h = 12; // TODO: Fetch from fraud service
    
    const avgSpendingPerCard = totalActive > 0 ? totalSpending30d / totalActive : 0;

    console.log(`✅ Found ${allCards.length} cards`);
    console.log(`   Active: ${totalActive}`);
    console.log(`   Frozen: ${frozenCount}`);
    console.log(`   Terminated: ${terminatedCount}`);

    return NextResponse.json({
      cards: allCards,
      stats: {
        totalActive,
        totalSpending30d,
        fraudBlocks24h,
        avgSpendingPerCard,
        frozenCount,
        terminatedCount,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards', details: error.message },
      { status: 500 }
    );
  }
}

