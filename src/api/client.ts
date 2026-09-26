/**
 * API Client - Central configuration for all HTTP requests.
 * Uses axios interceptors to automatically attach JWT token on every request.
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Change this to your machine's local IP when testing on a physical device
// e.g. 'http://192.168.1.5:5000'
export const BASE_URL = 'http://10.24.243.1:5000';

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
