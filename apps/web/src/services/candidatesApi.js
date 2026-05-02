import { API_BASE_URL, requestJson } from './apiClient';

function normalizeCandidate(rawCandidate) {
  return {
    id: rawCandidate._id,
    name: rawCandidate.name,
    role: rawCandidate.role,
    score: rawCandidate.score,
    stage: rawCandidate.stage,
    email: rawCandidate.email,
  };
}

export async function getCandidatesApi() {
  const payload = await requestJson(`${API_BASE_URL}/candidates`);
  return payload.data.map(normalizeCandidate);
}

export async function createCandidateApi(candidateInput) {
  const payload = await requestJson(`${API_BASE_URL}/candidates`, {
    method: 'POST',
    body: JSON.stringify(candidateInput),
  });

  return normalizeCandidate(payload.data);
}

export async function updateCandidateApi(candidateId, candidateInput) {
  const payload = await requestJson(`${API_BASE_URL}/candidates/${candidateId}`, {
    method: 'PATCH',
    body: JSON.stringify(candidateInput),
  });

  return normalizeCandidate(payload.data);
}

export async function deleteCandidateApi(candidateId) {
  await requestJson(`${API_BASE_URL}/candidates/${candidateId}`, {
    method: 'DELETE',
  });
}
