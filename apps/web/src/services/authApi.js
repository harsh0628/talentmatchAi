import { API_BASE_URL, requestJson } from './apiClient';

export async function loginApi(credentials) {
  const payload = await requestJson(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify(credentials),
  });

  return payload.data;
}

export async function registerApi(userInput) {
  const payload = await requestJson(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify(userInput),
  });

  return payload.data;
}

export async function meApi(accessToken) {
  const payload = await requestJson(`${API_BASE_URL}/auth/me`, {
    skipAuth: true,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return payload.data;
}

export async function refreshApi() {
  const payload = await requestJson(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    skipAuth: true,
    allowRefreshRetry: false,
    credentials: 'include',
  });

  return payload.data;
}

export async function logoutApi(accessToken) {
  const payload = await requestJson(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    skipAuth: true,
    allowRefreshRetry: false,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  return payload.data;
}

export async function checkEmailApi(email) {
  const encodedEmail = encodeURIComponent(email);
  const payload = await requestJson(`${API_BASE_URL}/auth/check-email?email=${encodedEmail}`, {
    skipAuth: true,
    allowRefreshRetry: false,
  });

  return payload.data;
}
