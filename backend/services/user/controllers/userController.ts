
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import admin from '../../../firebase';
import type { User } from '../models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const firestore = admin.firestore();
const usersCollection = firestore.collection('users');

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const usersSnapshot = await usersCollection.get();
  const users = usersSnapshot.docs.map(doc => {
    const data = doc.data();
    // Ensure we don't send back password hashes
    const { passwordHash, ...userWithoutPassword } = data;
    return { id: doc.id, ...userWithoutPassword };
  });
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching all users:", error);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
};


export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    
    const userQuery = await usersCollection.where('email', '==', email).limit(1).get();
    if (!userQuery.empty) {
        return res.status(409).json({ error: 'User already exists.' });
    }

  const passwordHash = await bcrypt.hash(password, 10);

  // Use Firebase Auth to create the user for authentication
  const userRecord = await admin.auth().createUser({
    email: email,
    password: password,
    displayName: name,
  });

  const newUser: Omit<User, 'id'> = {
    name,
    email,
    passwordHash,
    role: 'user',
    kycStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Use the Firebase Auth UID as the document ID in Firestore
  await usersCollection.doc(userRecord.uid).set(newUser);

  // Remove passwordHash from response
  const { passwordHash: _, ...userResponse } = newUser;

  return res.status(201).json({ id: userRecord.uid, ...userResponse });

  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({ error: 'Registration failed.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { credential, password } = req.body;
    if (!credential || !password) {
      return res.status(400).json({ error: 'Credential and password are required.' });
    }

    const isEmail = credential.includes('@');
    const queryField = isEmail ? 'email' : 'username';

    const userQuery = await usersCollection.where(queryField, '==', credential).limit(1).get();
    if (userQuery.empty) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    const userDoc = userQuery.docs[0];
    const user = userDoc.data() as User;
    
  const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    // Create a custom token for Firebase Auth
    const customToken = await admin.auth().createCustomToken(userDoc.id);
    
    return res.json({ token: customToken });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ error: 'Login failed.' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided.' });
    
    const token = authHeader.replace('Bearer ', '');
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    const userDoc = await usersCollection.doc(payload.userId).get();
    if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found.' });
    }

  const userData = userDoc.data();
  // Exclude passwordHash and id from response
  const { passwordHash, id, ...profileData } = userData as User;

  return res.json({ id: userDoc.id, ...profileData });
  } catch (err) {
    console.error("Get Profile Error:", err);
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

export const updateKycStatus = async (req: Request, res: Response) => {
  try {
    const { userId, kycStatus } = req.body;
    if (!userId || !kycStatus) {
      return res.status(400).json({ error: 'userId and kycStatus required.' });
    }
    const userRef = usersCollection.doc(userId);
    await userRef.update({ kycStatus, updatedAt: new Date() });
    
    const updatedDoc = await userRef.get();
    return res.json({ id: updatedDoc.id, kycStatus: updatedDoc.data()?.kycStatus });
  } catch (err) {
    console.error("KYC Update Error:", err);
    return res.status(500).json({ error: 'Failed to update KYC status.' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ error: 'userId and role required.' });
    }
    const userRef = usersCollection.doc(userId);
    await userRef.update({ role, updatedAt: new Date() });

    const updatedDoc = await userRef.get();
    return res.json({ id: updatedDoc.id, role: updatedDoc.data()?.role });
  } catch (err) {
    console.error("Role Update Error:", err);
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  return res.status(501).json({ message: 'Password reset not implemented.' });
};

export const confirmPasswordReset = async (req: Request, res: Response) => {
  return res.status(501).json({ message: 'Password reset not implemented.' });
};
