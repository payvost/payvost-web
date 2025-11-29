import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type ContentType = 'BLOG' | 'PRESS_RELEASE' | 'DOCUMENTATION' | 'KNOWLEDGE_BASE';
export type ContentStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';

export interface Content {
  id: string;
  title: string;
  slug: string;
  contentType: ContentType;
  status: ContentStatus;
  excerpt?: string;
  content: string;
  rawContent?: any;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords: string[];
  category?: string;
  tags: string[];
  featuredImage?: string;
  mediaIds: string[];
  authorId: string;
  authorName: string;
  coAuthors: string[];
  publishedAt?: string;
  scheduledAt?: string;
  expiresAt?: string;
  version: number;
  viewCount: number;
  likeCount: number;
  isPublic: boolean;
  allowComments: boolean;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentInput {
  title: string;
  slug?: string;
  contentType: ContentType;
  status?: ContentStatus;
  excerpt?: string;
  content: string;
  rawContent?: any;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  category?: string;
  tags?: string[];
  featuredImage?: string;
  mediaIds?: string[];
  coAuthors?: string[];
  publishedAt?: string;
  scheduledAt?: string;
  expiresAt?: string;
  isPublic?: boolean;
  allowComments?: boolean;
  language?: string;
}

export interface UpdateContentInput {
  title?: string;
  slug?: string;
  status?: ContentStatus;
  excerpt?: string;
  content?: string;
  rawContent?: any;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  category?: string;
  tags?: string[];
  featuredImage?: string;
  mediaIds?: string[];
  coAuthors?: string[];
  publishedAt?: string;
  scheduledAt?: string;
  expiresAt?: string;
  isPublic?: boolean;
  allowComments?: boolean;
  language?: string;
}

export interface ContentFilters {
  contentType?: ContentType;
  status?: ContentStatus;
  authorId?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ContentListResponse {
  items: Content[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ContentStats {
  total: number;
  published: number;
  draft: number;
  review: number;
  archived: number;
  byType: Record<string, number>;
}

// Get auth token from session
async function getAuthToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/writer-session');
    if (response.ok) {
      const data = await response.json();
      // Token should be in session cookie, but we need to get it from headers
      // For now, we'll rely on the cookie being sent automatically
      return null; // Cookie will be sent automatically
    }
    return null;
  } catch {
    return null;
  }
}

// Create axios instance with default config
// Use Next.js API routes which handle session cookie authentication
const contentApi = axios.create({
  baseURL: '/api/content', // Use Next.js API routes instead of direct backend
  withCredentials: true, // Send cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

export const contentService = {
  /**
   * List content with filters
   */
  async list(filters: ContentFilters = {}): Promise<ContentListResponse> {
    const params = new URLSearchParams();
    
    if (filters.contentType) params.append('contentType', filters.contentType);
    if (filters.status) params.append('status', filters.status);
    if (filters.authorId) params.append('authorId', filters.authorId);
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await contentApi.get(`?${params.toString()}`);
    return response.data;
  },

  /**
   * Get content by ID
   */
  async get(id: string): Promise<Content> {
    const response = await contentApi.get(`/${id}`);
    return response.data;
  },

  /**
   * Get content by slug (public)
   */
  async getBySlug(slug: string): Promise<Content> {
    const response = await contentApi.get(`/slug/${slug}`);
    return response.data;
  },

  /**
   * Create new content
   */
  async create(input: CreateContentInput): Promise<Content> {
    const response = await contentApi.post('/', input);
    return response.data;
  },

  /**
   * Update content
   */
  async update(id: string, input: UpdateContentInput): Promise<Content> {
    const response = await contentApi.patch(`/${id}`, input);
    return response.data;
  },

  /**
   * Publish content
   */
  async publish(id: string): Promise<Content> {
    const response = await contentApi.post(`/${id}/publish`, {});
    return response.data;
  },

  /**
   * Unpublish content
   */
  async unpublish(id: string): Promise<Content> {
    const response = await contentApi.post(`/${id}/unpublish`, {});
    return response.data;
  },

  /**
   * Delete content
   */
  async delete(id: string): Promise<void> {
    await contentApi.delete(`/${id}`);
  },

  /**
   * Get content statistics
   */
  async getStats(authorId?: string): Promise<ContentStats> {
    const params = authorId ? `?authorId=${authorId}` : '';
    const response = await contentApi.get(`/stats${params}`);
    return response.data;
  },

  /**
   * Get version history
   */
  async getVersions(contentId: string) {
    const response = await contentApi.get(`/${contentId}/versions`);
    return response.data;
  },

  /**
   * Restore to a specific version
   */
  async restoreVersion(contentId: string, version: number): Promise<Content> {
    const response = await contentApi.post(`/${contentId}/restore/${version}`);
    return response.data;
  },
};

