/**
 * API Client Service Layer
 * 
 * Centralized HTTP client for making requests to the backend API.
 * Handles authentication, error handling, and request/response interceptors.
 */

import { auth } from '@/lib/firebase';

// API configuration
// Use relative URLs for client-side to hit Next.js API routes
// Use backend URL for server-side
const isServer = typeof window === 'undefined';
const API_BASE_URL = isServer 
  ? (process.env.BACKEND_URL || 'http://localhost:3001')
  : ''; // Empty string means relative to current domain

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Request configuration options
 */
interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Base API client class
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authentication token from Firebase
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return null;
      }
      return await currentUser.getIdToken();
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof ApiError) {
      // Retry on network errors, timeouts, and 5xx server errors
      const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
      return retryableStatusCodes.includes(error.statusCode || 0) || 
             error.message.includes('timeout') ||
             error.message.includes('network');
    }
    // Retry on network errors
    if (error instanceof Error) {
      return error.name === 'AbortError' || 
             error.message.includes('fetch failed') ||
             error.message.includes('network');
    }
    return false;
  }

  /**
   * Make an HTTP request with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuth = false, timeout = 30000, retries = 2, retryDelay = 1000, ...fetchOptions } = options;
    
    let lastError: any;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.executeRequest<T>(endpoint, { skipAuth, timeout, ...fetchOptions });
      } catch (error) {
        lastError = error;
        
        // Don't retry on last attempt or if error is not retryable
        if (attempt >= retries || !this.isRetryableError(error)) {
          throw error;
        }
        
        // Calculate exponential backoff delay
        const delay = retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Execute a single HTTP request (without retry logic)
   */
  private async executeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuth = false, timeout = 30000, ...fetchOptions } = options;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge existing headers
    if (fetchOptions.headers) {
      const existingHeaders = fetchOptions.headers as Record<string, string>;
      Object.assign(headers, existingHeaders);
    }

    // Add authorization header if not skipped
    if (!skipAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Build full URL
    const url = `${this.baseUrl}${endpoint}`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check content type before parsing
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      // Handle non-OK responses
      if (!response.ok) {
        let errorData: any = {};
        if (isJson) {
          try {
            errorData = await response.json();
          } catch {
            // If JSON parsing fails, try to get text
            const text = await response.text().catch(() => '');
            errorData = { message: text || `HTTP ${response.status} Error` };
          }
        } else {
          const text = await response.text().catch(() => '');
          errorData = { message: text || `HTTP ${response.status} Error` };
        }
        throw new ApiError(
          errorData.message || errorData.error || 'Request failed',
          response.status,
          errorData
        );
      }

      // Parse JSON response
      if (!isJson) {
        const text = await response.text();
        throw new ApiError(
          `Expected JSON response but received ${contentType || 'unknown content type'}`,
          response.status
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('The request took too long to complete', 408);
      }
      
      // Handle network errors
      if (error instanceof Error && (error.message.includes('fetch failed') || error.message.includes('network'))) {
        throw new ApiError('Network error. Please check your connection and try again.', 0);
      }

      // Re-throw ApiError
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * Make a POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export default
export default apiClient;
