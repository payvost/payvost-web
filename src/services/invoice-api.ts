/**
 * Invoice API Client
 * 
 * Client for interacting with the PostgreSQL-based invoice API.
 * Replaces direct Firestore queries.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

export interface InvoiceFromInfo {
  name: string;
  address: string;
  email?: string;
  phone?: string;
}

export interface InvoiceToInfo {
  name: string;
  address: string;
  email: string;
  phone?: string;
}

export interface ManualBankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  otherDetails?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: 'USER' | 'BUSINESS';
  userId: string;
  businessId?: string;
  createdBy: string;
  issueDate: string | Date;
  dueDate: string | Date;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  currency: string;
  grandTotal: number | string;
  taxRate: number | string;
  fromInfo: InvoiceFromInfo;
  toInfo: InvoiceToInfo;
  items: InvoiceItem[];
  notes?: string;
  paymentMethod: 'PAYVOST' | 'MANUAL' | 'STRIPE';
  manualBankDetails?: ManualBankDetails;
  isPublic: boolean;
  publicUrl?: string;
  pdfUrl?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  paidAt?: string | Date;
}

export interface CreateInvoiceInput {
  invoiceNumber: string;
  invoiceType: 'USER' | 'BUSINESS';
  businessId?: string;
  issueDate: Date | string;
  dueDate: Date | string;
  currency: string;
  fromInfo: InvoiceFromInfo;
  toInfo: InvoiceToInfo;
  items: InvoiceItem[];
  taxRate?: number;
  notes?: string;
  paymentMethod: 'PAYVOST' | 'MANUAL' | 'STRIPE';
  manualBankDetails?: ManualBankDetails;
  status?: 'DRAFT' | 'PENDING';
}

export interface UpdateInvoiceInput {
  invoiceNumber?: string;
  issueDate?: Date | string;
  dueDate?: Date | string;
  status?: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  fromInfo?: InvoiceFromInfo;
  toInfo?: InvoiceToInfo;
  items?: InvoiceItem[];
  taxRate?: number;
  notes?: string;
  paymentMethod?: 'PAYVOST' | 'MANUAL' | 'STRIPE';
  manualBankDetails?: ManualBankDetails;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
}

export interface InvoiceStats {
  total: number;
  pending: number;
  paid: number;
  overdue: number;
  totalOutstanding: number;
  totalPaid: number;
}

/**
 * Get Firebase auth token
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { getAuth } = await import('firebase/auth');
    const { auth } = await import('@/lib/firebase');
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Invoice API Client
 */
export class InvoiceAPI {
  /**
   * List user invoices
   */
  static async listInvoices(options?: {
    status?: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    limit?: number;
    offset?: number;
  }): Promise<InvoiceListResponse> {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const query = params.toString();
    return apiRequest<InvoiceListResponse>(`/api/invoices${query ? `?${query}` : ''}`);
  }

  /**
   * List business invoices
   */
  static async listBusinessInvoices(
    businessId: string,
    options?: {
      status?: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
      limit?: number;
      offset?: number;
    }
  ): Promise<InvoiceListResponse> {
    const params = new URLSearchParams();
    params.append('businessId', businessId);
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    return apiRequest<InvoiceListResponse>(`/api/invoices/business?${params.toString()}`);
  }

  /**
   * Get invoice by ID
   */
  static async getInvoice(id: string): Promise<Invoice> {
    return apiRequest<Invoice>(`/api/invoices/${id}`);
  }

  /**
   * Get public invoice (no auth required)
   */
  static async getPublicInvoice(idOrNumber: string): Promise<Invoice> {
    const response = await fetch(`${API_BASE_URL}/api/invoices/public/${idOrNumber}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  /**
   * Create invoice
   */
  static async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
    // Convert dates to ISO strings
    const payload = {
      ...input,
      issueDate: input.issueDate instanceof Date 
        ? input.issueDate.toISOString() 
        : input.issueDate,
      dueDate: input.dueDate instanceof Date 
        ? input.dueDate.toISOString() 
        : input.dueDate,
    };

    return apiRequest<Invoice>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Update invoice
   */
  static async updateInvoice(
    id: string,
    input: UpdateInvoiceInput
  ): Promise<Invoice> {
    // Convert dates to ISO strings if present
    const payload: any = { ...input };
    if (input.issueDate) {
      payload.issueDate = input.issueDate instanceof Date 
        ? input.issueDate.toISOString() 
        : input.issueDate;
    }
    if (input.dueDate) {
      payload.dueDate = input.dueDate instanceof Date 
        ? input.dueDate.toISOString() 
        : input.dueDate;
    }

    return apiRequest<Invoice>(`/api/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Mark invoice as paid
   */
  static async markAsPaid(id: string): Promise<Invoice> {
    return apiRequest<Invoice>(`/api/invoices/${id}/mark-paid`, {
      method: 'POST',
    });
  }

  /**
   * Delete invoice
   */
  static async deleteInvoice(id: string): Promise<void> {
    await apiRequest(`/api/invoices/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get invoice statistics
   */
  static async getStats(): Promise<InvoiceStats> {
    return apiRequest<InvoiceStats>('/api/invoices/stats');
  }
}

