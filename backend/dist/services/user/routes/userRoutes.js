"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/register', userController_1.register);
router.post('/login', userController_1.login);
router.get('/profile', authMiddleware_1.authenticateJWT, userController_1.getProfile);
// Admin endpoints
router.post('/kyc', authMiddleware_1.authenticateJWT, userController_1.updateKycStatus);
router.post('/role', authMiddleware_1.authenticateJWT, userController_1.updateUserRole);
// Password reset
router.post('/password-reset/request', userController_1.requestPasswordReset);
router.post('/password-reset/confirm', userController_1.confirmPasswordReset);
exports.default = router;
