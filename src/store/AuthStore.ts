/**
 * AuthStore - Single source of truth for authentication state.
 *
 * Architecture:
 *  - Persists JWT token + user info to AsyncStorage (survives app restarts)
 *  - Exposes simple async functions: login, signup, logout, restore
 *  - No external state library needed — pure async functions
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, LoginPayload, SignupPayload } from '../api/authApi';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface StoredUser {
  email: string;
  displayName: string;
}

export interface AuthSession {
  token: string;
  user: StoredUser;
}

const AuthStore = {
  /**
   * Sign up and then automatically log in.
   * Returns the full AuthSession on success.
   */
  signup: async (payload: SignupPayload & { full_name: string }): Promise<AuthSession> => {
    // Step 1: Create account on backend
    await authApi.signup(payload);

    // Step 2: Immediately log in to get the JWT token
    const { token } = await authApi.login({
      email: payload.email,
      password: payload.password,
    });

    const user: StoredUser = {
      email: payload.email,
      displayName: payload.full_name || payload.email.split('@')[0],
    };

    // Step 3: Cache token + user info locally
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [USER_KEY, JSON.stringify(user)],
    ]);

    return { token, user };
  },

  /**
   * Log in with email + password.
   * Caches the JWT token and user info locally.
   */
  login: async (payload: LoginPayload, displayName?: string): Promise<AuthSession> => {
    const { token } = await authApi.login(payload);

    const user: StoredUser = {
      email: payload.email,
      displayName: displayName || payload.email.split('@')[0],
    };

    // Cache locally for next app launch (no need to log in again)
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [USER_KEY, JSON.stringify(user)],
    ]);

    return { token, user };
  },

  /**
   * Restore a previously saved session from local storage.
   * Call this on app startup to skip the login screen if already logged in.
   */
  restore: async (): Promise<AuthSession | null> => {
    const results = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
    const token = results[0][1];
    const userRaw = results[1][1];

    if (!token || !userRaw) return null;

    try {
      const user: StoredUser = JSON.parse(userRaw);
      return { token, user };
    } catch {
      return null;
    }
  },

  /**
   * Log out — removes the token and user info from local storage.
   */
  logout: async (): Promise<void> => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  },

  /**
   * Get just the stored token (useful for one-off API calls).
   */
  getToken: (): Promise<string | null> => AsyncStorage.getItem(TOKEN_KEY),
};

export default AuthStore;
