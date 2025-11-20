/**
 * Firebase Configuration API Endpoint
 * 
 * Provides Firebase config to service workers and client-side code.
 * Service workers cannot access process.env directly, so this endpoint
 * serves the configuration securely.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Only expose public Firebase config (safe for client-side)
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // Validate that required config is present
  if (!config.apiKey || !config.projectId) {
    return NextResponse.json(
      { error: 'Firebase configuration not available' },
      { status: 500 }
    );
  }

  // Return config with cache headers
  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Content-Type': 'application/json',
    },
  });
}

