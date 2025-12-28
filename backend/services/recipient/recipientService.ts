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
        payvostUserId?: string;
        bankName?: string;
        accountNumber?: string;
        swiftCode?: string;
        currency?: string;
        country?: string;
        type?: string;
    }) {
        // If it's intended to be internal or we have an email, check if they exist in Payvost
        let payvostUserId = data.payvostUserId;
        let type = data.type || 'EXTERNAL';

        if (!payvostUserId && data.email) {
            const targetUser = await prisma.user.findUnique({
                where: { email: data.email }
            });
            if (targetUser) {
                payvostUserId = targetUser.id;
                type = 'INTERNAL';
            }
        }

        return prisma.recipient.create({
            data: {
                userId,
                name: data.name,
                email: data.email,
                phone: data.phone,
                payvostUserId,
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                swiftCode: data.swiftCode,
                currency: data.currency,
                country: data.country,
                type
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
    async updateRecipient(userId: string, id: string, data: Partial<Omit<Recipient, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
        // Authorization check
        const recipient = await this.getRecipient(userId, id);
        if (!recipient) throw new Error('Recipient not found');

        return prisma.recipient.update({
            where: { id },
            data
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
