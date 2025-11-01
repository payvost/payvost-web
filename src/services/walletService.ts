/**
 * Wallet Service
 * 
 * Service for managing user wallets and accounts.
 * Connects to the backend wallet service API.
 */

import { apiClient, ApiError } from './apiClient';

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
   */
  async getAccounts(): Promise<Account[]> {
    try {
      const response = await apiClient.get<{ accounts: Account[] }>(
        '/api/wallet/accounts'
      );
      return response.accounts;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to fetch accounts: ${error.message}`);
      }
      throw error;
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
}

// Export singleton instance
export const walletService = new WalletService();

// Export default
export default walletService;
