import { apiClient, ApiError } from './apiClient';

export interface Recipient {
    id: string;
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    payvostUserId?: string;
    bankName?: string;
    accountNumber?: string;
    swiftCode?: string;
    currency?: string;
    country?: string;
    type: string; // 'INTERNAL' | 'EXTERNAL'
    createdAt: string;
    updatedAt: string;
}

export interface CreateRecipientDto {
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
}

class RecipientService {
    /**
     * List all saved recipients for the current user.
     */
    async list(): Promise<Recipient[]> {
        try {
            const response = await apiClient.get<{ recipients: Recipient[] }>('/api/recipient');
            return response.recipients;
        } catch (error) {
            if (error instanceof ApiError) {
                throw new Error(`Failed to list recipients: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Create a new saved recipient.
     */
    async create(data: CreateRecipientDto): Promise<Recipient> {
        try {
            const response = await apiClient.post<{ recipient: Recipient }>('/api/recipient', data);
            return response.recipient;
        } catch (error) {
            if (error instanceof ApiError) {
                throw new Error(`Failed to create recipient: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Get a specific recipient.
     */
    async get(id: string): Promise<Recipient> {
        try {
            const response = await apiClient.get<{ recipient: Recipient }>(`/api/recipient/${id}`);
            return response.recipient;
        } catch (error) {
            if (error instanceof ApiError) {
                throw new Error(`Failed to get recipient: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Update a saved recipient.
     */
    async update(id: string, data: Partial<CreateRecipientDto>): Promise<Recipient> {
        try {
            const response = await apiClient.patch<{ recipient: Recipient }>(`/api/recipient/${id}`, data);
            return response.recipient;
        } catch (error) {
            if (error instanceof ApiError) {
                throw new Error(`Failed to update recipient: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Delete a saved recipient.
     */
    async delete(id: string): Promise<void> {
        try {
            await apiClient.delete(`/api/recipient/${id}`);
        } catch (error) {
            if (error instanceof ApiError) {
                throw new Error(`Failed to delete recipient: ${error.message}`);
            }
            throw error;
        }
    }
}

export const recipientService = new RecipientService();
export default recipientService;
