const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim();

export const API_BASE_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://talentmatchaibackend.azurewebsites.net/api');

const AUTH_USER_KEY = 'tm_auth_user';

export function setStoredAuth(user) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
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
  const { headers = {}, ...rest } = options;
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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
