import { Router } from 'express';
import { register, login, getProfile, updateKycStatus, updateUserRole, requestPasswordReset, confirmPasswordReset } from '../controllers/userController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();


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
