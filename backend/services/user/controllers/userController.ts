import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name,
      },
    });
    return res.status(201).json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed.' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  // This should be protected by JWT middleware in production
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token provided.' });
    const token = auth.replace('Bearer ', '');
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    const user = await prisma.user.findUnique({ where: { id: (payload as any).userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({ id: user.id, email: user.email, name: user.name, role: user.role, kycStatus: user.kycStatus });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

// Update KYC status (admin only)
export const updateKycStatus = async (req: Request, res: Response) => {
  try {
    const { userId, kycStatus } = req.body;
    if (!userId || !kycStatus) {
      return res.status(400).json({ error: 'userId and kycStatus required.' });
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: { kycStatus },
    });
    return res.json({ id: user.id, kycStatus: user.kycStatus });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update KYC status.' });
  }
};

// Update user role (admin only)
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ error: 'userId and role required.' });
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    return res.json({ id: user.id, role: user.role });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
};

// Password reset request (scaffold)
export const requestPasswordReset = async (req: Request, res: Response) => {
  // TODO: Send password reset email/link
  return res.json({ message: 'Password reset request received.' });
};

// Password reset confirm (scaffold)
export const confirmPasswordReset = async (req: Request, res: Response) => {
  // TODO: Validate token and update password
  return res.json({ message: 'Password reset confirmed.' });
};
