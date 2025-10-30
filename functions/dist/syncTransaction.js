"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncTransactionToSupabase = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const supabase_js_1 = require("@supabase/supabase-js");
// Initialize Supabase client
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '' // use service role key for inserts
);
// Firestore trigger: when a transaction is created (using v1 API)
exports.syncTransactionToSupabase = functions.firestore
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
        if (error)
            throw error;
        console.log(`Synced transaction ${context.params.transactionId} → Supabase`);
    }
    catch (err) {
        console.error('Sync failed:', err);
    }
});
