import { Router, Response } from 'express';
import { verifyFirebaseToken, AuthenticatedRequest } from '../../gateway/middleware';
import { recipientService } from './recipientService';
import { validateRequest, recipientSchemas } from '../../common/validation-schemas';

const router = Router();

const normalizeCountry = (value?: string): string | undefined => {
    if (!value) return undefined;
    const raw = String(value).trim();
    if (!raw) return undefined;

    if (/^[a-zA-Z]{2,3}$/.test(raw)) return raw.toUpperCase();

    const countryMap: Record<string, string> = {
        Nigeria: 'NG',
        Ghana: 'GH',
        Kenya: 'KE',
        'South Africa': 'ZA',
        'United States': 'US',
        'United Kingdom': 'GB',
        Canada: 'CA',
        Australia: 'AU',
        Germany: 'DE',
        France: 'FR',
    };

    return countryMap[raw] || raw;
};

/**
 * GET /api/recipient
 * List all saved recipients for the authenticated user.
 */
router.get('/', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.uid;
        const recipients = await recipientService.listRecipients(userId!);
        res.status(200).json({ recipients });
    } catch (error: any) {
        console.error('Error listing recipients:', error);
        res.status(500).json({ error: error.message || 'Failed to list recipients' });
    }
});

/**
 * POST /api/recipient
 * Create a new saved recipient.
 */
router.post('/', verifyFirebaseToken, validateRequest(recipientSchemas.createRecipient), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.uid;
        const { countryCode, country, ...rest } = req.body as any;
        const recipient = await recipientService.createRecipient(userId!, {
            ...rest,
            country: normalizeCountry(countryCode || country),
        });
        res.status(201).json({ recipient });
    } catch (error: any) {
        console.error('Error creating recipient:', error);
        res.status(400).json({ error: error.message || 'Failed to create recipient' });
    }
});

/**
 * GET /api/recipient/:id
 * Get a specific recipient.
 */
router.get('/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.uid;
        const { id } = req.params;
        const recipient = await recipientService.getRecipient(userId!, id);
        if (!recipient) {
            return res.status(404).json({ error: 'Recipient not found' });
        }
        res.status(200).json({ recipient });
    } catch (error: any) {
        console.error('Error getting recipient:', error);
        res.status(500).json({ error: error.message || 'Failed to get recipient' });
    }
});

/**
 * PATCH /api/recipient/:id
 * Update a saved recipient.
 */
router.patch('/:id', verifyFirebaseToken, validateRequest(recipientSchemas.updateRecipient), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.uid;
        const { id } = req.params;
        const { countryCode, country, ...rest } = req.body as any;
        const recipient = await recipientService.updateRecipient(userId!, id, {
            ...rest,
            ...(countryCode || country ? { country: normalizeCountry(countryCode || country) } : {}),
        });
        res.status(200).json({ recipient });
    } catch (error: any) {
        console.error('Error updating recipient:', error);
        res.status(400).json({ error: error.message || 'Failed to update recipient' });
    }
});

/**
 * DELETE /api/recipient/:id
 * Delete a saved recipient.
 */
router.delete('/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.uid;
        const { id } = req.params;
        await recipientService.deleteRecipient(userId!, id);
        res.status(204).end();
    } catch (error: any) {
        console.error('Error deleting recipient:', error);
        res.status(400).json({ error: error.message || 'Failed to delete recipient' });
    }
});

export default router;
