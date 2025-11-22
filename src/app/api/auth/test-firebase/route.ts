import { NextRequest, NextResponse } from 'next/server';
import { admin, adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    initialized: false,
    auth: false,
    firestore: false,
    errors: [] as string[],
    warnings: [] as string[],
    env: {
      hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      hasServiceAccountKeyBase64: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64,
      hasDatabaseURL: !!process.env.FIREBASE_DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    },
  };

  try {
    // Check if initialized
    if (admin.apps.length > 0) {
      results.initialized = true;
    } else {
      results.errors.push('Firebase Admin SDK is not initialized');
      
      // Check why it might not be initialized
      if (!results.env.hasServiceAccountKey && !results.env.hasServiceAccountKeyBase64) {
        results.errors.push('Missing FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_KEY_BASE64');
      }
      
      return NextResponse.json(results, { status: 500 });
    }

    // Test Auth
    try {
      const authInstance = adminAuth;
      if (authInstance) {
        results.auth = true;
      }
    } catch (error: any) {
      results.errors.push(`Auth error: ${error.message}`);
    }

    // Test Firestore
    try {
      const dbInstance = adminDb;
      if (dbInstance) {
        results.firestore = true;
      }
    } catch (error: any) {
      results.errors.push(`Firestore error: ${error.message}`);
    }

    // Check service account key format if present
    if (results.env.hasServiceAccountKey) {
      try {
        const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY!;
        const parsed = JSON.parse(key);
        if (!parsed.project_id) {
          results.warnings.push('FIREBASE_SERVICE_ACCOUNT_KEY missing project_id');
        }
        if (!parsed.private_key) {
          results.warnings.push('FIREBASE_SERVICE_ACCOUNT_KEY missing private_key');
        }
        if (!parsed.client_email) {
          results.warnings.push('FIREBASE_SERVICE_ACCOUNT_KEY missing client_email');
        }
      } catch (error: any) {
        results.errors.push(`FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON: ${error.message}`);
      }
    }

    const hasErrors = results.errors.length > 0;
    return NextResponse.json(results, { 
      status: hasErrors ? 500 : 200 
    });
  } catch (error: any) {
    results.errors.push(`General error: ${error.message}`);
    return NextResponse.json(results, { status: 500 });
  }
}

