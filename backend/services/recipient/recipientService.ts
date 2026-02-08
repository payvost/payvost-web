import prisma from '../../common/prisma';
import { Recipient } from '@prisma/client';

/**
 * RecipientService
 * Handles the logic for managing saved recipients (Address Book).
 */
export class RecipientService {
    private static instance: RecipientService;

    private constructor() { }

    public static getInstance(): RecipientService {
        if (!this.instance) {
            this.instance = new RecipientService();
        }
        return this.instance;
    }

    /**
     * Create a new saved recipient for a user.
     */
    async createRecipient(userId: string, data: {
        name: string;
        email?: string;
        phone?: string;
        bankName?: string;
        accountNumber?: string;
        swiftCode?: string;
        currency?: string;
        country?: string;
        // Deprecated: internal Payvost-to-Payvost recipients are handled elsewhere.
        // The Address Book is for external payout targets only.
        type?: string;
    }) {
        const accountLast4 = data.accountNumber ? String(data.accountNumber).slice(-4) : undefined;

        return prisma.recipient.create({
            data: {
                userId,
                name: data.name,
                email: data.email,
                phone: data.phone,
                bankName: data.bankName,
                // Do not persist full account numbers long-term.
                accountNumber: null,
                accountLast4,
                swiftCode: data.swiftCode,
                currency: data.currency,
                country: data.country,
                // Force EXTERNAL: beneficiaries are external payout targets only.
                type: 'EXTERNAL',
            }
        });
    }

    /**
     * List all saved recipients for a user.
     */
    async listRecipients(userId: string) {
        return prisma.recipient.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' }
        });
    }

    /**
     * Get a specific recipient for a user.
     */
    async getRecipient(userId: string, id: string) {
        return prisma.recipient.findFirst({
            where: { id, userId }
        });
    }

    /**
     * Update a saved recipient.
     */
    async updateRecipient(
        userId: string,
        id: string,
        data: Partial<Pick<Recipient, 'name' | 'email' | 'phone' | 'bankName' | 'accountNumber' | 'swiftCode' | 'currency' | 'country'>>
    ) {
        // Authorization check
        const recipient = await this.getRecipient(userId, id);
        if (!recipient) throw new Error('Recipient not found');

        const accountLast4 = data.accountNumber !== undefined ? String(data.accountNumber).slice(-4) : undefined;

        return prisma.recipient.update({
            where: { id },
            data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.email !== undefined ? { email: data.email } : {}),
                ...(data.phone !== undefined ? { phone: data.phone } : {}),
                ...(data.bankName !== undefined ? { bankName: data.bankName } : {}),
                ...(data.accountNumber !== undefined
                    ? {
                          // Do not persist full account numbers long-term.
                          accountNumber: null,
                          accountLast4,
                      }
                    : {}),
                ...(data.swiftCode !== undefined ? { swiftCode: data.swiftCode } : {}),
                ...(data.currency !== undefined ? { currency: data.currency } : {}),
                ...(data.country !== undefined ? { country: data.country } : {}),
            },
        });
    }

    /**
     * Delete a saved recipient.
     */
    async deleteRecipient(userId: string, id: string) {
        // Authorization check
        const recipient = await this.getRecipient(userId, id);
        if (!recipient) throw new Error('Recipient not found');

        return prisma.recipient.delete({
            where: { id }
        });
    }
}

export const recipientService = RecipientService.getInstance();
