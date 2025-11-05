import { NextRequest } from 'next/server';
import { auth as firebaseAdminAuth } from '@/lib/firebase-admin';

export interface AuthContext {
  token: string;
  uid: string;
  claims: Record<string, unknown>;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Extract and verify the Firebase bearer token from the request.
 * Throws an HttpError with status 401/403 when the token is missing or invalid.
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    throw new HttpError(401, 'Unauthorized');
  }

  const token = authHeader.slice('Bearer '.length).trim() || authHeader.slice(7).trim();
  if (!token) {
    throw new HttpError(401, 'Unauthorized');
  }

  try {
    const decoded = await firebaseAdminAuth.verifyIdToken(token);
    return {
      token,
      uid: decoded.uid,
      claims: decoded,
    };
  } catch (error) {
    console.error('Failed to verify Firebase token', error);
    throw new HttpError(401, 'Invalid token');
  }
}

export { HttpError };
