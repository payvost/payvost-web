import * as functions from 'firebase-functions/v1';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '' // use service role key for inserts
);

// Firestore trigger: when a transaction is created (using v1 API)
export const syncTransactionToSupabase = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();

    try {
      // Insert record into Supabase (Postgres)
      const { error } = await supabase.from('transactions').insert([
        {
          id: context.params.transactionId,
          user_id: data.userId,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      console.log(`Synced transaction ${context.params.transactionId} → Supabase`);
    } catch (err) {
      console.error('Sync failed:', err);
    }
  });
