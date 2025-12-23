"use strict";
/**
 * User Sync Utility
 *
 * Ensures a Prisma User record exists for a Firebase user.
 * Syncs data from Firestore to Prisma database.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensurePrismaUser = ensurePrismaUser;
exports.syncPrismaUserData = syncPrismaUserData;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const prisma_1 = require("../../common/prisma");
/**
 * Ensure a Prisma User exists for the given Firebase UID.
 * If the user doesn't exist in Prisma, it will be created from Firestore data.
 *
 * @param firebaseUid - The Firebase user UID
 * @returns The Prisma User ID (same as Firebase UID) and whether it was created
 */
async function ensurePrismaUser(firebaseUid) {
    try {
        // Check if Prisma User already exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { id: firebaseUid },
        });
        if (existingUser) {
            return {
                prismaUserId: existingUser.id,
                created: false,
            };
        }
        // Fetch user data from Firestore
        const userDoc = await firebase_admin_1.default.firestore().collection('users').doc(firebaseUid).get();
        if (!userDoc.exists) {
            throw new Error(`Firebase user ${firebaseUid} not found in Firestore`);
        }
        const firestoreData = userDoc.data();
        if (!firestoreData) {
            throw new Error(`Firestore user ${firebaseUid} has no data`);
        }
        // Extract email - required field
        const email = firestoreData.email;
        if (!email || typeof email !== 'string') {
            throw new Error(`Firestore user ${firebaseUid} missing email`);
        }
        // Check if email already exists in Prisma (different Firebase UID but same email)
        const existingByEmail = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingByEmail) {
            // Email exists but with different ID - this shouldn't happen, but handle it
            console.warn(`Email ${email} already exists in Prisma with ID ${existingByEmail.id}, but Firebase UID is ${firebaseUid}`);
            // Update the existing user's ID to match Firebase UID (or handle conflict)
            // For now, we'll throw an error to prevent data inconsistency
            throw new Error(`Email ${email} already exists in Prisma with different ID`);
        }
        // Prepare Prisma User data
        // Note: password is required in schema, but Firebase users don't store password in Firestore
        // We'll use a placeholder that indicates this is a Firebase-authenticated user
        const passwordHash = firestoreData.passwordHash || 'firebase_auth_only';
        const prismaUserData = {
            id: firebaseUid, // Use Firebase UID as Prisma User ID
            email: email,
            password: passwordHash,
            name: firestoreData.name || firestoreData.fullName || null,
            role: firestoreData.role || 'user',
            kycStatus: firestoreData.kycStatus || 'pending',
            country: firestoreData.country || firestoreData.countryCode || null,
            userTier: firestoreData.userTier || 'STANDARD',
            // 2FA fields
            twoFactorEnabled: firestoreData.twoFactorEnabled || false,
            twoFactorMethod: firestoreData.twoFactorMethod || null,
            twoFactorSecret: firestoreData.twoFactorSecret || null,
            twoFactorPhone: firestoreData.twoFactorPhone || null,
            twoFactorBackupCodes: firestoreData.twoFactorBackupCodes || [],
            twoFactorVerified: firestoreData.twoFactorVerified || false,
        };
        // Create Prisma User
        const prismaUser = await prisma_1.prisma.user.create({
            data: prismaUserData,
        });
        console.log(`[UserSync] Created Prisma User ${prismaUser.id} for Firebase UID ${firebaseUid}`);
        return {
            prismaUserId: prismaUser.id,
            created: true,
        };
    }
    catch (error) {
        console.error(`[UserSync] Error syncing user ${firebaseUid}:`, error);
        throw new Error(`Failed to sync user: ${error.message}`);
    }
}
/**
 * Update Prisma User data from Firestore (for existing users)
 */
async function syncPrismaUserData(firebaseUid) {
    try {
        const userDoc = await firebase_admin_1.default.firestore().collection('users').doc(firebaseUid).get();
        if (!userDoc.exists || !userDoc.data()) {
            return; // User doesn't exist in Firestore, skip update
        }
        const firestoreData = userDoc.data();
        // Update Prisma User with latest Firestore data
        await prisma_1.prisma.user.update({
            where: { id: firebaseUid },
            data: {
                email: firestoreData.email,
                name: firestoreData.name || firestoreData.fullName || null,
                role: firestoreData.role || 'user',
                kycStatus: firestoreData.kycStatus || 'pending',
                country: firestoreData.country || firestoreData.countryCode || null,
                userTier: firestoreData.userTier || 'STANDARD',
                twoFactorEnabled: firestoreData.twoFactorEnabled || false,
                twoFactorMethod: firestoreData.twoFactorMethod || null,
                twoFactorSecret: firestoreData.twoFactorSecret || null,
                twoFactorPhone: firestoreData.twoFactorPhone || null,
                twoFactorBackupCodes: firestoreData.twoFactorBackupCodes || [],
                twoFactorVerified: firestoreData.twoFactorVerified || false,
            },
        });
    }
    catch (error) {
        console.error(`[UserSync] Error updating user ${firebaseUid}:`, error);
        // Don't throw - this is a background sync, failures shouldn't break the flow
    }
}
