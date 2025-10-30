"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = createPaymentIntent;
exports.getPaymentStatus = getPaymentStatus;
const registry_1 = require("../providers/registry");
const routing_1 = require("../utils/routing");
const validators_1 = require("../validators");
async function createPaymentIntent(req, res) {
    try {
        const paymentRequest = req.body;
        // Validate request
        (0, validators_1.validateAmount)(paymentRequest.amount);
        (0, validators_1.validateCurrency)(paymentRequest.currency);
        // Determine optimal payment provider based on amount, currency, region, etc.
        const provider = await (0, routing_1.determineOptimalProvider)(paymentRequest);
        // Create payment intent with chosen provider
        const intent = await provider.createPaymentIntent(paymentRequest);
        // Store payment intent in database
        await savePaymentIntentToDB(intent);
        res.json({
            paymentId: intent.id,
            clientSecret: intent.clientSecret,
            provider: provider.name,
            requiredFields: provider.getRequiredFields()
        });
    }
    catch (error) {
        console.error('Payment intent creation failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(400).json({ error: errorMessage });
    }
}
async function getPaymentStatus(req, res) {
    try {
        const { paymentId } = req.params;
        const payment = await getPaymentFromDB(paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        const provider = registry_1.PaymentProviderRegistry.get(payment.provider);
        const status = await provider.getPaymentStatus(paymentId);
        res.json({ status });
    }
    catch (error) {
        console.error('Payment status check failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ error: errorMessage });
    }
}
async function getPaymentFromDB(paymentId) {
    // TODO: implement actual DB lookup (e.g. using Prisma or your ORM)
    // This stub returns null to indicate "not found" and avoids returning void.
    return null;
}
function savePaymentIntentToDB(intent) {
    throw new Error('Function not implemented.');
}
