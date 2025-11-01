import { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import { createRequire } from 'module';

// Use createRequire relative to this file
const localRequire = createRequire(__filename);
const adminMod = localRequire('../../../firebase');
const admin = adminMod && adminMod.default ? adminMod.default : adminMod;

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    // Verify Firebase ID token
    const payload = await admin.auth().verifyIdToken(token);
    // Attach verified token payload (contains uid and claims)
    (req as any).user = payload;
    next();
  } catch (err) {
    console.error('Firebase token verification failed:', err instanceof Error ? err.message : String(err));
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
