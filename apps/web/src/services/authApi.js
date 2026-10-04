import { API_BASE_URL, requestJson } from './apiClient';

export async function loginApi(credentials) {
  const payload = await requestJson(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  return payload.data;
}

export async function registerApi(userInput) {
  const payload = await requestJson(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify(userInput),
  });
  return payload.data;
}

export async function meApi() {
  const payload = await requestJson(`${API_BASE_URL}/auth/me`);
  return payload.data;
}

export async function logoutApi() {
  const payload = await requestJson(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
  });
  return payload.data;
}

export async function checkEmailApi(email) {
  const encodedEmail = encodeURIComponent(email);
  const payload = await requestJson(`${API_BASE_URL}/auth/check-email?email=${encodedEmail}`);
  return payload.data;
}
