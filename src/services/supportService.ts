import { apiClient } from './apiClient';

export type TicketStatus = 'OPEN' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type MessageType = 'PUBLIC_REPLY' | 'INTERNAL_NOTE';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  customerId: string;
  assignedToId?: string | null;
  createdById?: string | null;
  tags: string[];
  metadata?: any;
  slaDeadline?: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    email: string;
    name?: string;
  };
  assignedTo?: {
    id: string;
    email: string;
    name?: string;
  };
  createdBy?: {
    id: string;
    email: string;
    name?: string;
  };
  _count?: {
    messages: number;
    attachments: number;
  };
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  type: MessageType;
  isRead: boolean;
  createdAt: string;
  author?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface TicketFilters {
  status?: TicketStatus | TicketStatus[];
  priority?: TicketPriority | TicketPriority[];
  assignedToId?: string | null;
  customerId?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface TicketListResponse {
  tickets: SupportTicket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TicketStats {
  total: number;
  byStatus: {
    open: number;
    pending: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  byPriority: Record<string, number>;
  byStatusGrouped: Record<string, number>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get authentication token from Firebase
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { auth } = await import('@/lib/firebase');
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const supportService = {
  /**
   * List tickets with filters
   */
  async listTickets(filters: TicketFilters = {}): Promise<TicketListResponse> {
    const params = new URLSearchParams();
    
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach(s => params.append('status', s));
      } else {
        params.append('status', filters.status);
      }
    }
    
    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        filters.priority.forEach(p => params.append('priority', p));
      } else {
        params.append('priority', filters.priority);
      }
    }
    
    if (filters.assignedToId !== undefined) {
      params.append('assignedToId', filters.assignedToId === null ? 'null' : filters.assignedToId);
    }
    
    if (filters.customerId) params.append('customerId', filters.customerId);
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    return apiRequest<TicketListResponse>(`/api/support/tickets?${params.toString()}`);
  },

  /**
   * Get ticket by ID
   */
  async getTicket(id: string): Promise<SupportTicket & { messages: TicketMessage[]; attachments: any[] }> {
    return apiRequest(`/api/support/tickets/${id}`);
  },

  /**
   * Create ticket
   */
  async createTicket(data: {
    subject: string;
    description: string;
    category: string;
    priority?: TicketPriority;
    customerId: string;
    tags?: string[];
  }): Promise<SupportTicket> {
    return apiRequest<SupportTicket>('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update ticket
   */
  async updateTicket(
    id: string,
    data: {
      subject?: string;
      description?: string;
      status?: TicketStatus;
      priority?: TicketPriority;
      category?: string;
      assignedToId?: string | null;
      tags?: string[];
    }
  ): Promise<SupportTicket> {
    return apiRequest<SupportTicket>(`/api/support/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Assign ticket
   */
  async assignTicket(id: string, assignedToId: string | null): Promise<SupportTicket> {
    return apiRequest<SupportTicket>(`/api/support/tickets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignedToId }),
    });
  },

  /**
   * Update ticket status
   */
  async updateStatus(id: string, status: TicketStatus): Promise<SupportTicket> {
    return apiRequest<SupportTicket>(`/api/support/tickets/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Add message to ticket
   */
  async addMessage(
    id: string,
    content: string,
    type: MessageType
  ): Promise<TicketMessage> {
    return apiRequest<TicketMessage>(`/api/support/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
  },

  /**
   * Get ticket statistics
   */
  async getStats(assignedToId?: string): Promise<TicketStats> {
    const params = new URLSearchParams();
    if (assignedToId) params.append('assignedToId', assignedToId);
    return apiRequest<TicketStats>(`/api/support/tickets/stats?${params.toString()}`);
  },
};

