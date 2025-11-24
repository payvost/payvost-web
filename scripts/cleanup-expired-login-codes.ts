/**
 * Cleanup script to remove expired login codes from Firestore
 * Run this script to clean up old OTP codes from the previous login system
 * 
 * Usage: npx ts-node scripts/cleanup-expired-login-codes.ts
 */

import { adminDb } from '../src/lib/firebase-admin';

async function cleanupExpiredLoginCodes() {
  try {
    console.log('🧹 Starting cleanup of expired login codes...');
    
    const loginCodesRef = adminDb.collection('loginCodes');
    const snapshot = await loginCodesRef.get();
    
    if (snapshot.empty) {
      console.log('✅ No login codes found. Nothing to clean up.');
      return;
    }

    const now = new Date();
    let deletedCount = 0;
    let activeCount = 0;

    const batch = adminDb.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate();

      if (!expiresAt || expiresAt < now) {
        // Code is expired, delete it
        batch.delete(doc.ref);
        deletedCount++;
        batchCount++;

        // Commit batch if we reach the limit
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`  Deleted ${batchCount} expired codes...`);
          batchCount = 0;
        }
      } else {
        activeCount++;
      }
    }

    // Commit remaining deletes
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`✅ Cleanup complete!`);
    console.log(`   - Deleted: ${deletedCount} expired codes`);
    console.log(`   - Active: ${activeCount} codes (will expire automatically)`);
    
  } catch (error) {
    console.error('❌ Error cleaning up login codes:', error);
    throw error;
  }
}

// Run the cleanup
cleanupExpiredLoginCodes()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });

