import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginApi, logoutApi, meApi, refreshApi, registerApi } from '../services/authApi';
import {
  clearStoredAuth,
  getStoredAccessToken,
  getStoredUser,
  setStoredAccessToken,
  setStoredAuth,
} from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(getStoredUser());
  const [accessToken, setAccessToken] = useState(getStoredAccessToken());
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        if (!accessToken) {
          const refreshed = await refreshApi();
          setAccessToken(refreshed.accessToken);
          setAuthUser(refreshed.user);
          setStoredAuth(refreshed.accessToken, refreshed.user);
          setAuthLoading(false);
          return;
        }

        const profile = await meApi(accessToken);
        setAuthUser(profile);
        setStoredAuth(accessToken, profile);
      } catch (error) {
        try {
          const refreshed = await refreshApi();
          setAccessToken(refreshed.accessToken);
          setAuthUser(refreshed.user);
          setStoredAuth(refreshed.accessToken, refreshed.user);
        } catch (refreshError) {
          clearStoredAuth();
          setAuthUser(null);
          setAccessToken('');
        }
      } finally {
        setAuthLoading(false);
      }
    }

    restoreSession();
  }, [accessToken]);

  async function login(credentials) {
    const result = await loginApi(credentials);
    setAccessToken(result.accessToken);
    setStoredAccessToken(result.accessToken);
    setAuthUser(result.user);
    setStoredAuth(result.accessToken, result.user);
    return result.user;
  }

  async function register(userInput) {
    const result = await registerApi(userInput);
    setAccessToken(result.accessToken);
    setStoredAccessToken(result.accessToken);
    setAuthUser(result.user);
    setStoredAuth(result.accessToken, result.user);
    return result.user;
  }

  async function logout() {
    try {
      await logoutApi(accessToken);
    } catch (error) {
      // Ignore logout API errors and clear local auth regardless.
    }

    clearStoredAuth();
    setAccessToken('');
    setAuthUser(null);
  }

  const value = useMemo(
    () => ({
      authUser,
      accessToken,
      authLoading,
      isAuthenticated: Boolean(authUser && accessToken),
      login,
      register,
      logout,
    }),
    [authUser, accessToken, authLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
