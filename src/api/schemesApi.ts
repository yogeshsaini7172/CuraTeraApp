/**
 * Schemes API - All scheme-related API calls.
 * Fetches schemes and search results from the backend server / database.
 */
import apiClient from './client';
import { Scheme } from '../types';

export interface GetSchemesParams {
  page?: number;
  limit?: number;
  category?: string;
  q?: string;
  email?: string;
}

export interface PaginatedSchemesResponse {
  schemes: Scheme[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  eligibleCount: number;
}

export const schemesApi = {
  /**
   * Fetch paginated schemes from backend.
   * Loads in chunks (e.g. 10 at a time) on scroll.
   */
  getSchemes: async (params?: GetSchemesParams): Promise<PaginatedSchemesResponse> => {
    const res = await apiClient.get<PaginatedSchemesResponse>('/api/schemes', {
      params,
    });
    return res.data;
  },

  /**
   * Search schemes semantically or by keyword
   */
  searchSchemes: async (query: string, email?: string): Promise<Scheme[]> => {
    const res = await apiClient.get<Scheme[]>('/api/schemes/search', {
      params: { q: query, email },
    });
    return res.data;
  },
};

