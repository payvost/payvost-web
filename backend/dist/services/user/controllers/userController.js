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
exports.confirmPasswordReset = exports.requestPasswordReset = exports.updateUserRole = exports.updateKycStatus = exports.getProfile = exports.login = exports.register = exports.getAllUsers = void 0;
const bcrypt = __importStar(require("bcrypt"));
const module_1 = require("module");
// Use createRequire relative to this file for reliable resolution
const localRequire = (0, module_1.createRequire)(__filename);
const adminMod = localRequire('../../../firebase');
const admin = adminMod && adminMod.default ? adminMod.default : adminMod;
// Note: This service uses Firebase Auth, not JWT. JWT_SECRET is not needed here.
const firestore = admin.firestore();
const usersCollection = firestore.collection('users');
const getAllUsers = async (_req, res) => {
    try {
        const usersSnapshot = await usersCollection.get();
        const users = usersSnapshot.docs.map((doc) => {
            const data = doc.data();
            // Ensure we don't send back password hashes
            const { passwordHash, ...userWithoutPassword } = data;
            return { id: doc.id, ...userWithoutPassword };
        });
        return res.status(200).json(users);
    }
    catch (error) {
        console.error("Error fetching all users:", error);
        return res.status(500).json({ error: 'Failed to fetch users.' });
    }
};
exports.getAllUsers = getAllUsers;
const register = async (req, res) => {
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
        const newUser = {
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
    }
    catch (err) {
        console.error("Registration Error:", err);
        return res.status(500).json({ error: 'Registration failed.' });
    }
};
exports.register = register;
const login = async (req, res) => {
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
        const user = userDoc.data();
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        // Create a custom token for Firebase Auth
        const customToken = await admin.auth().createCustomToken(userDoc.id);
        return res.json({ token: customToken });
    }
    catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({ error: 'Login failed.' });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        // The authentication middleware now verifies Firebase ID tokens and attaches `user` to the request.
        const userPayload = req.user;
        if (!userPayload?.uid)
            return res.status(401).json({ error: 'No authenticated user.' });
        const userDoc = await usersCollection.doc(userPayload.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const userData = userDoc.data();
        // Exclude passwordHash and id from response
        const { passwordHash, id, ...profileData } = userData;
        return res.json({ id: userDoc.id, ...profileData });
    }
    catch (err) {
        console.error("Get Profile Error:", err);
        return res.status(500).json({ error: 'Failed to fetch profile.' });
    }
};
exports.getProfile = getProfile;
const updateKycStatus = async (req, res) => {
    try {
        const { userId, kycStatus } = req.body;
        if (!userId || !kycStatus) {
            return res.status(400).json({ error: 'userId and kycStatus required.' });
        }
        const userRef = usersCollection.doc(userId);
        await userRef.update({ kycStatus, updatedAt: new Date() });
        const updatedDoc = await userRef.get();
        return res.json({ id: updatedDoc.id, kycStatus: updatedDoc.data()?.kycStatus });
    }
    catch (err) {
        console.error("KYC Update Error:", err);
        return res.status(500).json({ error: 'Failed to update KYC status.' });
    }
};
exports.updateKycStatus = updateKycStatus;
const updateUserRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        if (!userId || !role) {
            return res.status(400).json({ error: 'userId and role required.' });
        }
        const userRef = usersCollection.doc(userId);
        await userRef.update({ role, updatedAt: new Date() });
        const updatedDoc = await userRef.get();
        return res.json({ id: updatedDoc.id, role: updatedDoc.data()?.role });
    }
    catch (err) {
        console.error("Role Update Error:", err);
        return res.status(500).json({ error: 'Failed to update user role.' });
    }
};
exports.updateUserRole = updateUserRole;
const requestPasswordReset = async (req, res) => {
    return res.status(501).json({ message: 'Password reset not implemented.' });
};
exports.requestPasswordReset = requestPasswordReset;
const confirmPasswordReset = async (req, res) => {
    return res.status(501).json({ message: 'Password reset not implemented.' });
};
exports.confirmPasswordReset = confirmPasswordReset;
