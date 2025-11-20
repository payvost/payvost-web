"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_service_1 = require("./src/invoice-service");
const middleware_1 = require("../../gateway/middleware");
const prisma_1 = require("../../common/prisma");
const router = (0, express_1.Router)();
const invoiceService = new invoice_service_1.InvoiceService(prisma_1.prisma);
/**
 * GET /invoices
 * List user's invoices
 */
router.get('/', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { status, limit, offset } = req.query;
        const result = await invoiceService.listUserInvoices(userId, {
            status: status,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error listing invoices:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * GET /invoices/stats
 * Get invoice statistics
 */
router.get('/stats', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const stats = await invoiceService.getInvoiceStats(userId);
        res.json(stats);
    }
    catch (error) {
        console.error('Error getting invoice stats:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * GET /invoices/business
 * List business invoices
 */
router.get('/business', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { businessId, status, limit, offset } = req.query;
        if (!businessId) {
            return res.status(400).json({ error: 'businessId is required' });
        }
        const result = await invoiceService.listBusinessInvoices(businessId, userId, {
            status: status,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error listing business invoices:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * GET /invoices/:id
 * Get invoice by ID
 */
router.get('/:id', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.uid;
        const invoice = await invoiceService.getInvoiceById(id, userId);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json(invoice);
    }
    catch (error) {
        console.error('Error getting invoice:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * GET /invoices/public/:id
 * Get public invoice (no auth required)
 */
router.get('/public/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await invoiceService.getPublicInvoice(id);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found or not public' });
        }
        res.json(invoice);
    }
    catch (error) {
        console.error('Error getting public invoice:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * POST /invoices
 * Create new invoice
 */
router.post('/', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const invoice = await invoiceService.createInvoice({
            ...req.body,
            userId,
            createdBy: userId,
        });
        res.status(201).json(invoice);
    }
    catch (error) {
        console.error('Error creating invoice:', error);
        res.status(400).json({ error: error.message || 'Invalid invoice data' });
    }
});
/**
 * PATCH /invoices/:id
 * Update invoice
 */
router.patch('/:id', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const invoice = await invoiceService.updateInvoice(id, userId, req.body);
        res.json(invoice);
    }
    catch (error) {
        console.error('Error updating invoice:', error);
        if (error.message === 'Invoice not found' || error.message === 'Unauthorized') {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message || 'Invalid update data' });
    }
});
/**
 * POST /invoices/:id/mark-paid
 * Mark invoice as paid
 */
router.post('/:id/mark-paid', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const invoice = await invoiceService.markAsPaid(id, userId);
        res.json(invoice);
    }
    catch (error) {
        console.error('Error marking invoice as paid:', error);
        if (error.message === 'Invoice not found' || error.message === 'Unauthorized') {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message || 'Failed to mark as paid' });
    }
});
/**
 * DELETE /invoices/:id
 * Delete invoice
 */
router.delete('/:id', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        await invoiceService.deleteInvoice(id, userId);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting invoice:', error);
        if (error.message === 'Invoice not found' || error.message === 'Unauthorized') {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message || 'Failed to delete invoice' });
    }
});
exports.default = router;
