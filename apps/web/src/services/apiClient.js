const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim();

export const API_BASE_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const ACCESS_TOKEN_KEY = 'tm_access_token';
const AUTH_USER_KEY = 'tm_auth_user';
let refreshPromise = null;

export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
}

export function setStoredAuth(accessToken, user) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function setStoredAccessToken(accessToken) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearStoredAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    clearStoredAuth();
    return null;
  }
}

export async function requestJson(url, options = {}) {
  const { skipAuth = false, allowRefreshRetry = true, headers = {}, ...rest } = options;

  async function executeRequest() {
    const token = getStoredAccessToken();

    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...rest,
    });

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error('Invalid server response');
    }

    if (!response.ok || payload.success === false) {
      const error = new Error(payload.message || 'API request failed');
      error.statusCode = response.status;
      throw error;
    }

    return payload;
  }

  try {
    return await executeRequest();
  } catch (error) {
    const shouldRefresh =
      !skipAuth &&
      allowRefreshRetry &&
      error.statusCode === 401;

    if (!shouldRefresh) {
      throw error;
    }

    await refreshAccessToken();
    return requestJson(url, { ...options, allowRefreshRetry: false });
  }
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let payload;
      try {
        payload = await response.json();
      } catch (error) {
        clearStoredAuth();
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok || payload.success === false) {
        clearStoredAuth();
        throw new Error(payload.message || 'Session expired. Please login again.');
      }

      const user = payload.data.user || getStoredUser() || null;
      if (user) {
        setStoredAuth(payload.data.accessToken, user);
      } else {
        setStoredAccessToken(payload.data.accessToken);
      }

      return payload.data.accessToken;
    })();
  }

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}
