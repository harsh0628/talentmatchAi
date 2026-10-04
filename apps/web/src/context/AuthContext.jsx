import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginApi, logoutApi, meApi, registerApi } from '../services/authApi';
import { clearStoredAuth, getStoredUser, setStoredAuth } from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(getStoredUser());
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const profile = await meApi();
        setAuthUser(profile);
        setStoredAuth(profile);
      } catch (error) {
        clearStoredAuth();
        setAuthUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(credentials) {
    const result = await loginApi(credentials);
    setAuthUser(result.user);
    setStoredAuth(result.user);
    return result.user;
  }

  async function register(userInput) {
    const result = await registerApi(userInput);
    setAuthUser(result.user);
    setStoredAuth(result.user);
    return result.user;
  }

  async function logout() {
    try {
      await logoutApi();
    } catch (error) {
      // Clear local state even when the server session has already expired.
    }

    clearStoredAuth();
    setAuthUser(null);
  }

  const value = useMemo(
    () => ({
      authUser,
      authLoading,
      isAuthenticated: Boolean(authUser),
      login,
      register,
      logout,
    }),
    [authUser, authLoading],
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
