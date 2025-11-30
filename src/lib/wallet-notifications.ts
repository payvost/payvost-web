/**
 * Wallet Balance Notification Helpers
 * Check wallet balance and send appropriate notifications
 * 
 * Note: This uses client-side Firebase. For server-side, use firebase-admin
 */

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { notifyLowBalance, notifyBalanceThreshold } from './unified-notifications';

interface WalletBalance {
  currency: string;
  balance: number;
}

/**
 * Check wallet balance and send low balance alerts if needed
 */
export async function checkWalletBalanceAndNotify(
  userId: string,
  wallets: WalletBalance[],
  lowBalanceThreshold: number = 10
): Promise<void> {
  try {
    // Get user preferences
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    // Check if user has low balance alerts enabled
    if (userData?.preferences?.lowBalanceAlerts === false) {
      return; // User has disabled low balance alerts
    }

    // Check each wallet
    for (const wallet of wallets) {
      const balance = wallet.balance || 0;
      const currency = wallet.currency || 'USD';
      
      // Check for low balance
      if (balance > 0 && balance < lowBalanceThreshold) {
        // Check if we've already sent a low balance notification recently
        // (to avoid spamming)
        const recentNotifications = await getDocs(
          query(
            collection(db, 'users', userId, 'notifications'),
            where('data.alertType', '==', 'low_balance'),
            where('data.currency', '==', currency),
            orderBy('date', 'desc'),
            limit(1)
          )
        );

        const lastNotification = recentNotifications.docs[0];
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        // Only send if we haven't sent one in the last 24 hours
        if (!lastNotification) {
          await notifyLowBalance(userId, balance, currency, lowBalanceThreshold);
        } else {
          const lastNotificationData = lastNotification.data();
          const lastNotificationDate = lastNotificationData.date?.toDate ? lastNotificationData.date.toDate() : new Date(lastNotificationData.date);
          if (lastNotificationDate < oneDayAgo) {
            await notifyLowBalance(userId, balance, currency, lowBalanceThreshold);
          }
        }
      }

      // Check for custom balance threshold (if user has set one)
      const customThreshold = userData?.balanceThresholds?.[currency];
      if (customThreshold && balance <= customThreshold) {
        await notifyBalanceThreshold(userId, balance, currency, customThreshold);
      }
    }
  } catch (error) {
    console.error('Error checking wallet balance and sending notifications:', error);
    // Don't throw - this is a background check
  }
}

/**
 * Helper to check balance after a transaction
 */
export async function checkBalanceAfterTransaction(
  userId: string,
  currency: string,
  newBalance: number
): Promise<void> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    const wallets = userData?.wallets || [];
    
    // Find the wallet for this currency
    const wallet = wallets.find((w: any) => w.currency === currency);
    if (!wallet) return;

    // Update wallet balance
    wallet.balance = newBalance;
    
    // Check all wallets for alerts
    await checkWalletBalanceAndNotify(userId, wallets);
  } catch (error) {
    console.error('Error checking balance after transaction:', error);
  }
}

