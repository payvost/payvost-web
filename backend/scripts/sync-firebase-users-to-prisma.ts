/**
 * Migration Script: Sync Firebase Users to Prisma
 * 
 * This script syncs all Firebase users from Firestore to Prisma database.
 * Run this once to migrate existing users.
 * 
 * Usage:
 *   npx ts-node backend/scripts/sync-firebase-users-to-prisma.ts
 */

import admin from 'firebase-admin';
import { prisma } from '../common/prisma';
import { ensurePrismaUser } from '../services/user/syncUser';

async function syncAllFirebaseUsers() {
  try {
    console.log('Starting Firebase to Prisma user sync...');

    // Get all users from Firestore
    const usersSnapshot = await admin.firestore().collection('users').get();
    
    console.log(`Found ${usersSnapshot.size} users in Firestore`);

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ uid: string; error: string }> = [];

    for (const userDoc of usersSnapshot.docs) {
      const firebaseUid = userDoc.id;
      const userData = userDoc.data();

      try {
        const result = await ensurePrismaUser(firebaseUid);
        if (result.created) {
          console.log(`✓ Created Prisma User for ${firebaseUid} (${userData.email || 'no email'})`);
        } else {
          console.log(`- Prisma User already exists for ${firebaseUid}`);
        }
        successCount++;
      } catch (error: any) {
        console.error(`✗ Failed to sync user ${firebaseUid}:`, error.message);
        errorCount++;
        errors.push({
          uid: firebaseUid,
          error: error.message,
        });
      }
    }

    console.log('\n=== Sync Summary ===');
    console.log(`Total users: ${usersSnapshot.size}`);
    console.log(`Successfully synced: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n=== Errors ===');
      errors.forEach(({ uid, error }) => {
        console.log(`  ${uid}: ${error}`);
      });
    }

    console.log('\nSync completed!');
  } catch (error) {
    console.error('Fatal error during sync:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncAllFirebaseUsers()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

