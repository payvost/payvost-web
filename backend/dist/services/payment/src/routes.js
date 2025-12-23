"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("./controllers/payment.controller");
const rateLimiter_1 = require("../../../gateway/rateLimiter");
const middleware_1 = require("../../../gateway/middleware");
const router = (0, express_1.Router)();
// Payment Intent Creation - Requires authentication and rate limiting
router.post('/create-intent', middleware_1.verifyFirebaseToken, rateLimiter_1.transactionLimiter, payment_controller_1.createPaymentIntent);
// Compatibility alias for existing frontend usage
router.post('/create-payment-intent', middleware_1.verifyFirebaseToken, rateLimiter_1.transactionLimiter, payment_controller_1.createPaymentIntent);
// Payment Status Check - Requires authentication
router.get('/status/:paymentId', middleware_1.verifyFirebaseToken, payment_controller_1.getPaymentStatus);
// Provider-specific routes
router.post('/providers/:provider/webhook', (req, res) => {
    // Handle provider-specific webhooks
});
exports.default = router;
