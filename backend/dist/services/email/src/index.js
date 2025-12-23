"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// @ts-ignore - Common file is compiled separately to dist/common
const mailgun_1 = require("../../common/mailgun");
const app = (0, express_1.default)();
const PORT = process.env.EMAIL_SERVICE_PORT || 3006;
const NODE_ENV = process.env.NODE_ENV || 'development';
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || 'no-reply@payvost.com';
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'email-service',
        timestamp: new Date().toISOString(),
        mailgunConfigured: (0, mailgun_1.isMailgunConfigured)(),
        method: 'API',
    });
});
// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        service: 'Payvost Email Service',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            batch: 'POST /batch',
            single: 'POST /single',
        },
    });
});
// Single email endpoint
app.post('/single', async (req, res) => {
    try {
        const { to, subject, html, text, from, cc, bcc, replyTo, tags, template, templateVariables } = req.body;
        if (!to || !subject) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['to', 'subject'],
            });
        }
        // Either template or html must be provided
        if (!template && !html) {
            return res.status(400).json({
                error: 'Either template or html must be provided',
            });
        }
        console.log(`[Email Service] Sending single email to: ${to}${template ? ` using template: ${template}` : ''}`);
        // Prepare email options
        const emailOptions = {
            to,
            subject,
            from: from || `Payvost <${MAILGUN_FROM_EMAIL}>`,
            cc,
            bcc,
            replyTo,
            tags,
        };
        // If using Mailgun template
        if (template) {
            emailOptions.template = template;
            emailOptions.variables = templateVariables || {}; // mailgun.ts expects 'variables'
            // Don't set html when using template - Mailgun will use the template
        }
        else {
            // Use HTML directly
            emailOptions.html = html;
            emailOptions.text = text || html.replace(/<[^>]*>/g, ''); // Strip HTML for text version
        }
        const result = await (0, mailgun_1.sendEmail)(emailOptions);
        if (!result.success) {
            console.error(`[Email Service] Failed to send email: ${result.error}`);
            return res.status(500).json({
                error: 'Failed to send email',
                message: result.error,
            });
        }
        console.log(`[Email Service] Email sent successfully: ${result.messageId}`);
        return res.status(200).json({
            success: true,
            messageId: result.messageId,
        });
    }
    catch (error) {
        console.error('[Email Service] Error sending email:', error.message);
        return res.status(500).json({
            error: 'Failed to send email',
            message: error.message,
            details: NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});
// Batch email endpoint
app.post('/batch', async (req, res) => {
    try {
        const body = req.body;
        const { emails } = body;
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                error: 'Invalid emails array',
                message: 'emails must be a non-empty array',
            });
        }
        // Limit batch size to prevent abuse
        const MAX_BATCH_SIZE = 100;
        if (emails.length > MAX_BATCH_SIZE) {
            return res.status(400).json({
                error: 'Batch size exceeded',
                message: `Batch size limited to ${MAX_BATCH_SIZE} emails`,
                received: emails.length,
            });
        }
        console.log(`[Email Service] Processing batch of ${emails.length} emails`);
        // Send emails in parallel with rate limiting
        const results = await Promise.allSettled(emails.map(async (email) => {
            if (!email.to || !email.subject || !email.html) {
                throw new Error('Missing required fields: to, subject, html');
            }
            const result = await (0, mailgun_1.sendEmail)({
                to: email.to,
                subject: email.subject,
                html: email.html,
                text: email.text || email.html.replace(/<[^>]*>/g, ''),
                from: `Payvost <${MAILGUN_FROM_EMAIL}>`,
            });
            if (!result.success) {
                throw new Error(result.error || 'Failed to send email');
            }
            return { messageId: result.messageId };
        }));
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`[Email Service] Batch complete: ${successful} successful, ${failed} failed`);
        return res.status(200).json({
            success: true,
            total: emails.length,
            successful,
            failed,
            results: results.map((r, i) => ({
                email: emails[i].to,
                status: r.status,
                messageId: r.status === 'fulfilled' ? r.value.messageId : null,
                error: r.status === 'rejected' ? r.reason.message : null,
            })),
        });
    }
    catch (error) {
        console.error('[Email Service] Error processing batch:', error.message);
        return res.status(500).json({
            error: 'Failed to process batch emails',
            message: error.message,
            details: NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});
// Graceful shutdown
const shutdown = async () => {
    console.log('[Email Service] Shutting down gracefully...');
    process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Start server
app.listen(PORT, () => {
    console.log(`[Email Service] Running on port ${PORT}`);
    console.log(`[Email Service] Environment: ${NODE_ENV}`);
    console.log(`[Email Service] Mailgun API: ${(0, mailgun_1.isMailgunConfigured)() ? 'configured' : 'not configured'}`);
    console.log(`[Email Service] Domain: ${process.env.MAILGUN_DOMAIN || 'not set'}`);
    console.log(`[Email Service] Endpoints:`);
    console.log(`  - GET http://localhost:${PORT}/health`);
    console.log(`  - POST http://localhost:${PORT}/single`);
    console.log(`  - POST http://localhost:${PORT}/batch`);
});
