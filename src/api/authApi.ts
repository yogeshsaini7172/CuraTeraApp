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

  /**
   * Log in via Firebase Auth ID Token (Google, etc).
   * mode: 'login' → only sign in existing users
   * mode: 'signup' → register new user first, then sign in
   */
  firebaseLogin: async (id_token: string, mode: 'login' | 'signup' | 'auto' = 'auto'): Promise<AuthResponse> => {
    let fcm_token: string | null = null;
    try {
      fcm_token = await getFCMToken();
    } catch (_) {}

    const res = await apiClient.post('/api/auth/firebase', {
      id_token,
      fcm_token,
      mode,
    });
    return res.data;
  },

  /**
   * Request OTP code for forgot password.
   */
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/api/auth/forgot-password', { email });
    return res.data;
  },

  /**
   * Verify 6-digit OTP code before proceeding to set new password.
   */
  verifyOtp: async (email: string, otp: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post('/api/auth/verify-otp', { email, otp });
    return res.data;
  },

  /**
   * Reset password using OTP code.
   */
  resetPassword: async (payload: { email: string; otp: string; new_password: string }): Promise<{ message: string }> => {
    const res = await apiClient.post('/api/auth/reset-password', payload);
    return res.data;
  },
};



