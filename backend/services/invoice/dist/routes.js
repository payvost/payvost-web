"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const invoice_service_1 = require("./invoice-service");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const invoiceService = new invoice_service_1.InvoiceService(prisma);
// Middleware to verify Firebase token
const verifyFirebaseToken = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Missing authorization token' });
    }
    try {
        const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    }
    catch (error) {
        console.error('Firebase token verification failed:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
// GET /api/invoices - Get all invoices for a user
router.get('/invoices', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const invoices = await invoiceService.getInvoicesByUserId(userId);
        res.json(invoices);
    }
    catch (error) {
        console.error('GET /api/invoices error:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});
// GET /api/invoices/:id - Get a specific invoice
router.get('/invoices/:id', verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;
        const invoice = await invoiceService.getInvoiceById(id, userId);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json(invoice);
    }
    catch (error) {
        console.error('GET /api/invoices/:id error:', error);
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
});
// POST /api/invoices - Create a new invoice
router.post('/invoices', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const payload = req.body;
        const invoice = await invoiceService.createInvoice({
            ...payload,
            userId,
            createdBy: userId,
        });
        res.status(201).json(invoice);
    }
    catch (error) {
        console.error('POST /api/invoices error:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});
// PUT /api/invoices/:id - Update an invoice
router.put('/invoices/:id', verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;
        const payload = req.body;
        const invoice = await invoiceService.updateInvoice(id, userId, payload);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json(invoice);
    }
    catch (error) {
        console.error('PUT /api/invoices/:id error:', error);
        res.status(500).json({ error: 'Failed to update invoice' });
    }
});
// POST /api/invoices/:id/mark-paid - Mark invoice as paid
router.post('/invoices/:id/mark-paid', verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;
        const invoice = await invoiceService.markAsPaid(id, userId);
        res.json(invoice);
    }
    catch (error) {
        console.error('POST /api/invoices/:id/mark-paid error:', error);
        if (error.message === 'Invoice not found') {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        if (error.message === 'Unauthorized') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        res.status(500).json({ error: 'Failed to mark invoice as paid' });
    }
});
// DELETE /api/invoices/:id - Delete an invoice
router.delete('/invoices/:id', verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;
        const success = await invoiceService.deleteInvoice(id, userId);
        res.json({ message: 'Invoice deleted successfully' });
    }
    catch (error) {
        console.error('DELETE /api/invoices/:id error:', error);
        if (error.message === 'Invoice not found') {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        if (error.message === 'Unauthorized') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        res.status(500).json({ error: 'Failed to delete invoice' });
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map