
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // This route is no longer used for Firebase Auth.
    // Client-side authentication is handled directly with the Firebase SDK.
    // This file can be removed or kept for other potential server-side auth logic.
    return NextResponse.json({ message: 'This endpoint is not active for Firebase Auth.' }, { status: 404 });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
