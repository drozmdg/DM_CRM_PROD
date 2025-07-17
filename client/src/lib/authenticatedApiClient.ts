/**
 * Authenticated API Client
 * Provides API request functions that automatically include authentication headers
 */

import { useAuth } from "@/contexts/AuthContext";

export class AuthenticatedApiClient {
  private getAuthHeaders: () => Record<string, string>;

  constructor(getAuthHeaders: () => Record<string, string>) {
    this.getAuthHeaders = getAuthHeaders;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    return response;
  }

  async get(endpoint: string): Promise<any> {
    const response = await this.request(endpoint, { method: 'GET' });
    return response.json();
  }

  async post(endpoint: string, data?: any): Promise<any> {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async put(endpoint: string, data?: any): Promise<any> {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async patch(endpoint: string, data?: any): Promise<any> {
    const response = await this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async delete(endpoint: string): Promise<void> {
    await this.request(endpoint, { method: 'DELETE' });
  }

  async postForm(endpoint: string, formData: FormData): Promise<any> {
    const headers = this.getAuthHeaders();
    delete headers['Content-Type']; // Let browser set multipart boundary
    
    const response = await this.request(endpoint, {
      method: 'POST',
      body: formData,
      headers,
    });
    return response.json();
  }
}

/**
 * Hook to get authenticated API client instance
 */
export const useApiClient = (): AuthenticatedApiClient => {
  const { getAuthHeaders } = useAuth();
  return new AuthenticatedApiClient(getAuthHeaders);
};

/**
 * Create API client with auth headers function
 */
export const createApiClient = (getAuthHeaders: () => Record<string, string>): AuthenticatedApiClient => {
  return new AuthenticatedApiClient(getAuthHeaders);
};