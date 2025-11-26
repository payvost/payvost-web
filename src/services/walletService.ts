/**
 * Wallet Service
 * 
 * Service for managing user wallets and accounts.
 * Connects to the backend wallet service API.
 * Falls back to Firestore if API fails.
 */

import { apiClient, ApiError } from './apiClient';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Account/Wallet types
 */
export interface Account {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  type: 'PERSONAL' | 'BUSINESS';
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountDto {
  currency: string;
  type?: 'PERSONAL' | 'BUSINESS';
}

export interface FundAccountDto {
  accountId: string;
  amount: number;
  method: 'CARD' | 'BANK_TRANSFER' | 'CRYPTO' | 'OTHER';
  reference?: string;
}

export interface WithdrawDto {
  accountId: string;
  amount: number;
  method: 'BANK_TRANSFER' | 'CRYPTO' | 'OTHER';
  destination: string;
}

/**
 * Wallet Service class
 */
class WalletService {
  /**
   * Get all accounts for the authenticated user
   * Falls back to Firestore if API fails
   */
  async getAccounts(): Promise<Account[]> {
    try {
      const response = await apiClient.get<{ accounts: Account[] }>(
        '/api/wallet/accounts'
      );
      return response.accounts;
    } catch (error) {
      console.warn('API call failed, falling back to Firestore for wallets:', error);
      
      // Fallback to Firestore
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('User not authenticated');
        }

        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          return [];
        }

        const userData = userDoc.data();
        const firestoreWallets = userData.wallets || [];

        // Convert Firestore wallet format to Account format
        const accounts: Account[] = firestoreWallets.map((wallet: any, index: number) => ({
          id: wallet.id || `firestore-${index}`,
          userId: currentUser.uid,
          currency: wallet.currency || 'USD',
          balance: parseFloat(wallet.balance?.toString() || '0'),
          type: (wallet.type || 'PERSONAL') as 'PERSONAL' | 'BUSINESS',
          createdAt: wallet.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: wallet.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }));

        console.log('Successfully fetched accounts from Firestore fallback:', accounts.length);
        return accounts;
      } catch (firestoreError) {
        console.error('Firestore fallback also failed:', firestoreError);
        if (error instanceof ApiError) {
          throw new Error(`Failed to fetch accounts: ${error.message}`);
        }
        throw error;
      }
    }
  }

  /**
   * Get a specific account by ID
   */
  async getAccount(accountId: string): Promise<Account> {
    try {
      const response = await apiClient.get<{ account: Account }>(
        `/api/wallet/accounts/${accountId}`
      );
      return response.account;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to fetch account: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Create a new account
   */
  async createAccount(data: CreateAccountDto): Promise<Account> {
    try {
      const response = await apiClient.post<{ account: Account }>(
        '/api/wallet/accounts',
        data
      );
      return response.account;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to create account: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fund an account
   */
  async fundAccount(data: FundAccountDto): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/api/wallet/fund',
        data
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to fund account: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Withdraw from an account
   */
  async withdraw(data: WithdrawDto): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/api/wallet/withdraw',
        data
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to withdraw from account: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(accountId: string): Promise<number> {
    try {
      const account = await this.getAccount(accountId);
      return account.balance;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to get balance: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Deduct balance from an account for external transactions
   */
  async deductBalance(data: {
    accountId: string;
    amount: number;
    currency: string;
    description?: string;
    referenceId?: string;
  }): Promise<{ success: boolean; data: any }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: any }>(
        '/api/wallet/deduct',
        data
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to deduct balance: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Refund balance to an account (for failed external transactions)
   */
  async refundBalance(data: {
    accountId: string;
    amount: number;
    currency: string;
    description?: string;
    referenceId?: string;
  }): Promise<{ success: boolean; data: any }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: any }>(
        '/api/wallet/refund',
        data
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to refund balance: ${error.message}`);
      }
      throw error;
    }
  }
}

// Export singleton instance
export const walletService = new WalletService();

// Export default
export default walletService;
