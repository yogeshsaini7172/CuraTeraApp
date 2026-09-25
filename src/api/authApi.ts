/**
 * Auth API - All authentication-related API calls.
 */
import apiClient from './client';
import { getFCMToken } from '../utils/fcm';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  token: string;
  message: string;
}

export const authApi = {
  /**
   * Sign up a new user.
   * Returns a success message; user must then login.
   */
  signup: async (payload: SignupPayload): Promise<{ message: string }> => {
    const res = await apiClient.post('/api/auth/signup', payload);
    return res.data;
  },

  /**
   * Log in an existing user.
   * Also sends the FCM device token so the backend can send push notifications.
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    // Get FCM token silently — don't block login if it fails
    let fcm_token: string | null = null;
    try {
      fcm_token = await getFCMToken();
    } catch (_) {}

    const res = await apiClient.post('/api/auth/login', {
      ...payload,
      fcm_token,
    });
    return res.data;
  },
};
