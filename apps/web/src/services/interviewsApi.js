import { API_BASE_URL, requestJson } from './apiClient';

function normalizeInterview(rawInterview) {
  return {
    id: rawInterview._id,
    date: rawInterview.date,
    candidate: rawInterview.candidate,
    panel: rawInterview.panel,
    mode: rawInterview.mode,
    status: rawInterview.status,
  };
}

export async function getInterviewsApi() {
  const payload = await requestJson(`${API_BASE_URL}/interviews`);
  return payload.data.map(normalizeInterview);
}

export async function updateInterviewApi(interviewId, interviewInput) {
  const payload = await requestJson(`${API_BASE_URL}/interviews/${interviewId}`, {
    method: 'PATCH',
    body: JSON.stringify(interviewInput),
  });

  return normalizeInterview(payload.data);
}
