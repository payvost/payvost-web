"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Single, robust initializer for firebase-admin.
// Supports both environment variable (production) and local file (development).
const LOCAL_SA_FILENAME = 'payvost-web-firebase-adminsdk-fbsvc-f14c86f5d6.json';
function initFirebaseAdmin() {
    if (firebase_admin_1.default.apps.length)
        return firebase_admin_1.default;
    try {
        let credential;
        const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const envB64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
        if (envJson || envB64) {
            console.log('Firebase Admin initialized using environment variable');
            let parsed;
            try {
                const raw = envJson ?? Buffer.from(envB64, 'base64').toString('utf8');
                parsed = JSON.parse(raw);
            }
            catch (e) {
                const hint = `Invalid FIREBASE_SERVICE_ACCOUNT_KEY${envB64 ? '_BASE64' : ''}. Ensure it's valid JSON${envB64 ? ' after base64 decoding' : ''}.`;
                throw new Error(`${hint} Original error: ${e?.message || e}`);
            }
            if (parsed.private_key && typeof parsed.private_key === 'string') {
                parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
            }
            credential = firebase_admin_1.default.credential.cert(parsed);
        }
        else {
            // Development: use local file
            const serviceAccountPath = path_1.default.resolve(__dirname, LOCAL_SA_FILENAME);
            if (!fs_1.default.existsSync(serviceAccountPath)) {
                console.warn(`No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT_KEY or place ${LOCAL_SA_FILENAME} in the backend folder.`);
                return firebase_admin_1.default;
            }
            console.log(`Firebase Admin initialized using local key: ${LOCAL_SA_FILENAME}`);
            const raw = fs_1.default.readFileSync(serviceAccountPath, 'utf8');
            const serviceAccount = JSON.parse(raw);
            if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            credential = firebase_admin_1.default.credential.cert(serviceAccount);
        }
        firebase_admin_1.default.initializeApp({
            credential,
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
        return firebase_admin_1.default;
    }
    catch (err) {
        console.error('Failed to initialize firebase-admin:', err instanceof Error ? err.message : String(err));
        throw err;
    }
}
initFirebaseAdmin();
exports.default = firebase_admin_1.default;
