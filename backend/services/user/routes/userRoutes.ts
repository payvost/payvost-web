import { Router } from 'express';
import path from 'path';
import { createRequire } from 'module';

// Use createRequire rooted at this file so relative imports resolve reliably
const localRequire = createRequire(__filename);
const controllersMod = localRequire('../controllers/userController');
const { register, login, getProfile, updateKycStatus, updateUserRole, requestPasswordReset, confirmPasswordReset } = controllersMod && controllersMod.default ? controllersMod.default : controllersMod;
const authMod = localRequire('../middleware/authMiddleware');
const { authenticateJWT } = authMod && authMod.default ? authMod.default : authMod;


const router = Router();


// GET /user - Return list of users from Firebase
import admin from 'firebase-admin';
router.get('/', async (req, res) => {
  try {
    const users: any[] = [];
    let nextPageToken: string | undefined;
    do {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      users.push(...result.users);
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    // Map Firebase users to a simple format
    const customers = users.map(user => ({
      id: user.uid,
      name: user.displayName || user.email || 'Unknown',
      email: user.email || '',
      phone: user.phoneNumber || '',
      kycStatus: user.customClaims?.kycStatus || 'Unverified',
      userType: user.customClaims?.userType || 'Normal User',
      country: user.customClaims?.country || 'Unknown',
      countryCode: user.customClaims?.countryCode || 'US',
      riskScore: user.customClaims?.riskScore || 0,
      totalSpend: user.customClaims?.totalSpend || 0,
      associatedAccounts: user.customClaims?.associatedAccounts || [],
    }));

    res.status(200).json({ customers });
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    res.status(500).json({ error: message });
  }
});


router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateJWT, getProfile);

// Admin endpoints
router.post('/kyc', authenticateJWT, updateKycStatus);
router.post('/role', authenticateJWT, updateUserRole);

// Password reset
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/confirm', confirmPasswordReset);

export default router;
