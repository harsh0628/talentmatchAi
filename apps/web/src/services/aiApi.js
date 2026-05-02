import { API_BASE_URL, requestJson } from './apiClient';

export async function generateMatchScoreApi(payload) {
  const response = await requestJson(`${API_BASE_URL}/ai/match-score`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function generateHybridScoreApi(payload) {
  const response = await requestJson(`${API_BASE_URL}/ai/match-score-hybrid`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function generateWorkflowScoreApi(payload) {
  const response = await requestJson(`${API_BASE_URL}/ai/match-score-workflow`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function generateSkillGapAnalysisApi(payload) {
  const response = await requestJson(`${API_BASE_URL}/ai/skill-gap-analysis`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}
