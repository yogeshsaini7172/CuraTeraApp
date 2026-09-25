/**
 * Schemes API - All scheme-related API calls.
 * Fetches schemes and search results from the backend server / database.
 */
import apiClient from './client';
import { Scheme } from '../types';

export const schemesApi = {
  /**
   * Fetch all schemes from backend.
   * Optionally pass user email for personalized eligibility sorting.
   */
  getSchemes: async (email?: string): Promise<Scheme[]> => {
    const res = await apiClient.get<Scheme[]>('/api/schemes/', {
      params: email ? { email } : undefined,
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
