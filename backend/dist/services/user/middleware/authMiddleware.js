"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
const module_1 = require("module");
// Use createRequire relative to this file
const localRequire = (0, module_1.createRequire)(__filename);
const adminMod = localRequire('../../../firebase');
const admin = adminMod && adminMod.default ? adminMod.default : adminMod;
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided.' });
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        // Verify Firebase ID token
        const payload = await admin.auth().verifyIdToken(token);
        // Attach verified token payload (contains uid and claims)
        req.user = payload;
        next();
    }
    catch (err) {
        console.error('Firebase token verification failed:', err instanceof Error ? err.message : String(err));
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};
exports.authenticateJWT = authenticateJWT;
