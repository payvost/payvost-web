"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPasswordReset = exports.requestPasswordReset = exports.updateUserRole = exports.updateKycStatus = exports.getProfile = exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists.' });
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: passwordHash,
                name,
            },
        });
        return res.status(201).json({ id: user.id, email: user.email, name: user.name });
    }
    catch (err) {
        return res.status(500).json({ error: 'Registration failed.' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const valid = await bcrypt_1.default.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token });
    }
    catch (err) {
        return res.status(500).json({ error: 'Login failed.' });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    // This should be protected by JWT middleware in production
    try {
        const auth = req.headers.authorization;
        if (!auth)
            return res.status(401).json({ error: 'No token provided.' });
        const token = auth.replace('Bearer ', '');
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user)
            return res.status(404).json({ error: 'User not found.' });
        return res.json({ id: user.id, email: user.email, name: user.name, role: user.role, kycStatus: user.kycStatus });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch profile.' });
    }
};
exports.getProfile = getProfile;
// Update KYC status (admin only)
const updateKycStatus = async (req, res) => {
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
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to update KYC status.' });
    }
};
exports.updateKycStatus = updateKycStatus;
// Update user role (admin only)
const updateUserRole = async (req, res) => {
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
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to update user role.' });
    }
};
exports.updateUserRole = updateUserRole;
// Password reset request (scaffold)
const requestPasswordReset = async (req, res) => {
    // TODO: Send password reset email/link
    return res.json({ message: 'Password reset request received.' });
};
exports.requestPasswordReset = requestPasswordReset;
// Password reset confirm (scaffold)
const confirmPasswordReset = async (req, res) => {
    // TODO: Validate token and update password
    return res.json({ message: 'Password reset confirmed.' });
};
exports.confirmPasswordReset = confirmPasswordReset;
