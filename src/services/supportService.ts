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

/**
 * Make authenticated API request
 * Uses Next.js API routes which proxy to backend
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Get auth token for Authorization header
  try {
    const { auth } = await import('@/lib/firebase');
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch {
    // Ignore auth errors - session cookie will be used
  }

  // Use relative URL to hit Next.js API routes
  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'include', // Include cookies
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
  } catch (fetchError: any) {
    // Handle network errors
    if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
      throw new Error('Request timeout: The server did not respond in time. Please try again.');
    }
    
    if (fetchError.message?.includes('fetch failed') || fetchError.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }
    
    throw new Error(fetchError.message || 'Network error occurred while making the request');
  }

  if (!response.ok) {
    let error: any = { error: 'Unknown error' };
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        error = await response.json();
      } else {
        const text = await response.text();
        error = { error: text || `HTTP ${response.status} Error` };
      }
    } catch (parseError) {
      error = { error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const errorMessage = error.error || error.message || `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  try {
    return await response.json();
  } catch (parseError) {
    throw new Error('Invalid response from server: Expected JSON but received other content');
  }
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

    const queryString = params.toString();
    return apiRequest<TicketListResponse>(`/api/support/tickets${queryString ? `?${queryString}` : ''}`);
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
    metadata?: any;
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
    const queryString = params.toString();
    return apiRequest<TicketStats>(`/api/support/tickets/stats${queryString ? `?${queryString}` : ''}`);
  },

  // ==================== Chat Session Methods ====================

  /**
   * List chat sessions
   */
  async listChatSessions(filters: {
    status?: 'WAITING' | 'ACTIVE' | 'ENDED' | ('WAITING' | 'ACTIVE' | 'ENDED')[];
    agentId?: string | null;
    customerId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ sessions: any[]; pagination: any }> {
    const params = new URLSearchParams();
    
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach(s => params.append('status', s));
      } else {
        params.append('status', filters.status);
      }
    }
    
    if (filters.agentId !== undefined) {
      params.append('agentId', filters.agentId === null ? 'null' : filters.agentId);
    }
    
    if (filters.customerId) params.append('customerId', filters.customerId);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    return apiRequest(`/api/support/chat/sessions?${params.toString()}`);
  },

  /**
   * Get chat queue (waiting sessions)
   */
  async getChatQueue(): Promise<any[]> {
    return apiRequest('/api/support/chat/queue');
  },

  /**
   * Get chat session by ID
   */
  async getChatSession(id: string): Promise<any> {
    return apiRequest(`/api/support/chat/sessions/${id}`);
  },

  /**
   * Create chat session
   */
  async createChatSession(customerId: string, agentId?: string): Promise<any> {
    return apiRequest('/api/support/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ customerId, agentId }),
    });
  },

  /**
   * Assign chat session
   */
  async assignChatSession(sessionId: string, agentId: string): Promise<any> {
    return apiRequest(`/api/support/chat/sessions/${sessionId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ agentId }),
    });
  },

  /**
   * End chat session
   */
  async endChatSession(sessionId: string): Promise<any> {
    return apiRequest(`/api/support/chat/sessions/${sessionId}/end`, {
      method: 'POST',
    });
  },

  /**
   * Add message to chat
   */
  async addChatMessage(sessionId: string, content: string, type: string = 'text'): Promise<any> {
    return apiRequest(`/api/support/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
  },

  /**
   * Get chat statistics
   */
  async getChatStats(agentId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (agentId) params.append('agentId', agentId);
    const queryString = params.toString();
    return apiRequest(`/api/support/chat/stats${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Add tag to chat session
   */
  async addChatTag(sessionId: string, tag: string): Promise<any> {
    return apiRequest(`/api/support/chat/sessions/${sessionId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tag }),
    });
  },

  /**
   * Remove tag from chat session
   */
  async removeChatTag(sessionId: string, tag: string): Promise<any> {
    return apiRequest(`/api/support/chat/sessions/${sessionId}/tags/${tag}`, {
      method: 'DELETE',
    });
  },

  /**
   * Update notes for chat session
   */
  async updateChatNotes(sessionId: string, note: string): Promise<any> {
    return apiRequest(`/api/support/chat/sessions/${sessionId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  /**
   * Update priority for chat session
   */
  async updateChatPriority(sessionId: string, priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'): Promise<any> {
    return apiRequest(`/api/support/chat/sessions/${sessionId}/priority`, {
      method: 'POST',
      body: JSON.stringify({ priority }),
    });
  },

  /**
   * Get saved replies
   */
  async getSavedReplies(category?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    const queryString = params.toString();
    return apiRequest(`/api/support/chat/saved-replies${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Create saved reply
   */
  async createSavedReply(title: string, content: string, category?: string): Promise<any> {
    return apiRequest('/api/support/chat/saved-replies', {
      method: 'POST',
      body: JSON.stringify({ title, content, category }),
    });
  },

  /**
   * Use saved reply (increment usage)
   */
  async useSavedReply(id: string): Promise<any> {
    return apiRequest(`/api/support/chat/saved-replies/${id}/use`, {
      method: 'POST',
    });
  },

  /**
   * Get chat analytics
   */
  async getChatAnalytics(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    return apiRequest(`/api/support/chat/analytics${queryString ? `?${queryString}` : ''}`);
  },
};

