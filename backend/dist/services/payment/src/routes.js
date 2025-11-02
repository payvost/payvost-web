"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("./controllers/payment.controller");
const router = (0, express_1.Router)();
// Payment Intent Creation
router.post('/create-intent', payment_controller_1.createPaymentIntent);
// Compatibility alias for existing frontend usage
router.post('/create-payment-intent', payment_controller_1.createPaymentIntent);
// Payment Status Check
router.get('/status/:paymentId', payment_controller_1.getPaymentStatus);
// Provider-specific routes
router.post('/providers/:provider/webhook', (req, res) => {
    // Handle provider-specific webhooks
});
exports.default = router;
