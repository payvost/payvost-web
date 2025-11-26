/**
 * Invoice API Client
 * 
 * Client for interacting with the PostgreSQL-based invoice API.
 * Replaces direct Firestore queries.
 */

// Use relative URLs for client-side to hit Next.js API routes
// Use backend URL for server-side
const isServer = typeof window === 'undefined';
const API_BASE_URL = isServer 
  ? (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001')
  : ''; // Empty string means relative to current domain

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
  paymentMethod: 'PAYVOST' | 'MANUAL' | 'STRIPE' | 'RAPYD';
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
  paymentMethod: 'PAYVOST' | 'MANUAL' | 'STRIPE' | 'RAPYD';
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
  paymentMethod?: 'PAYVOST' | 'MANUAL' | 'STRIPE' | 'RAPYD';
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
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Check content type before parsing
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let error: any = { error: 'Unknown error' };
    if (isJson) {
      try {
        error = await response.json();
      } catch {
        const text = await response.text().catch(() => '');
        error = { error: text || `HTTP ${response.status} Error` };
      }
    } else {
      const text = await response.text().catch(() => '');
      // If we get HTML, it's likely a 404 page or error page
      if (contentType.includes('text/html')) {
        if (response.status === 404) {
          error = { error: `API endpoint not found: ${endpoint}. Please check if the backend service is running.` };
        } else {
          error = { error: `Server returned HTML instead of JSON (Status: ${response.status}). The API endpoint may not be available.` };
        }
      } else {
        error = { error: text || `HTTP ${response.status} Error` };
      }
    }
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  // If response is OK but not JSON, something is wrong
  if (!isJson) {
    const text = await response.text();
    // Provide more helpful error message
    if (contentType.includes('text/html')) {
      throw new Error(
        `API endpoint returned HTML instead of JSON. This usually means the endpoint doesn't exist or the backend service isn't running. Endpoint: ${endpoint}`
      );
    }
    throw new Error(`Expected JSON response but received ${contentType || 'unknown content type'}`);
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
    
    // Check content type before parsing
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    
    if (!response.ok) {
      let error: any = { error: 'Unknown error' };
      if (isJson) {
        try {
          error = await response.json();
        } catch {
          const text = await response.text().catch(() => '');
          error = { error: text || `HTTP ${response.status} Error` };
        }
      } else {
        const text = await response.text().catch(() => '');
        // If we get HTML, it's likely a 404 page or error page
        if (contentType.includes('text/html')) {
          if (response.status === 404) {
            error = { error: `Invoice not found: ${idOrNumber}` };
          } else {
            error = { error: `Server returned HTML instead of JSON (Status: ${response.status}). The API endpoint may not be available.` };
          }
        } else {
          error = { error: text || `HTTP ${response.status} Error` };
        }
      }
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    // If response is OK but not JSON, something is wrong
    if (!isJson) {
      const text = await response.text();
      // Provide more helpful error message
      if (contentType.includes('text/html')) {
        throw new Error(
          `API endpoint returned HTML instead of JSON. This usually means the endpoint doesn't exist or the backend service isn't running. Endpoint: /api/invoices/public/${idOrNumber}`
        );
      }
      throw new Error(`Expected JSON response but received ${contentType || 'unknown content type'}`);
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
   * Falls back to Firestore if API fails
   */
  static async markAsPaid(id: string): Promise<Invoice> {
    try {
      return await apiRequest<Invoice>(`/api/invoices/${id}/mark-paid`, {
        method: 'POST',
      });
    } catch (error) {
      console.warn('API call failed, falling back to Firestore for invoice update:', error);
      
      // Fallback to Firestore
      try {
        const { db } = await import('@/lib/firebase');
        const { doc, updateDoc, getDoc } = await import('firebase/firestore');
        
        // Try to find invoice in 'invoices' collection
        let invoiceRef = doc(db, 'invoices', id);
        let invoiceDoc = await getDoc(invoiceRef);
        
        // If not found, try 'businessInvoices' collection
        if (!invoiceDoc.exists()) {
          invoiceRef = doc(db, 'businessInvoices', id);
          invoiceDoc = await getDoc(invoiceRef);
        }
        
        if (!invoiceDoc.exists()) {
          throw new Error(`Invoice not found: ${id}`);
        }

        const invoiceData = invoiceDoc.data();
        
        // Update invoice status to PAID
        await updateDoc(invoiceRef, {
          status: 'PAID',
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Return updated invoice
        const updatedInvoice: Invoice = {
          ...invoiceData,
          id: invoiceDoc.id,
          status: 'PAID',
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Invoice;

        console.log('Successfully updated invoice in Firestore fallback:', id);
        return updatedInvoice;
      } catch (firestoreError) {
        console.error('Firestore fallback also failed:', firestoreError);
        throw error; // Throw original error if Firestore also fails
      }
    }
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

