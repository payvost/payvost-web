import * as functions from 'firebase-functions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  functions.config().supabase.url,
  functions.config().supabase.service_key // use service role key for inserts
);

// Firestore trigger: when a transaction is created
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
