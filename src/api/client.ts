/**
 * API Client - Central configuration for all HTTP requests.
 * Uses axios interceptors to automatically attach JWT token on every request.
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Over USB cable with 'adb reverse tcp:5000 tcp:5000', localhost:5000 routes directly to this PC.
// Alternatively for direct Wi-Fi without cable, use: 'http://10.114.64.97:5000'
export const BASE_URL = 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every outgoing request automatically
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Handle global response errors (e.g., token expired → logout)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear local session
      await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
