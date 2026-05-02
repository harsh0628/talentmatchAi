import { API_BASE_URL, requestJson } from './apiClient';

function normalizeReport(rawReport) {
  return {
    id: rawReport._id,
    candidateId: rawReport.candidateId,
    name: rawReport.name,
    role: rawReport.role,
    technical: rawReport.technical,
    communication: rawReport.communication,
    problemSolving: rawReport.problemSolving,
    summary: rawReport.summary || '',
    strengths: Array.isArray(rawReport.strengths) ? rawReport.strengths : [],
    improvements: Array.isArray(rawReport.improvements) ? rawReport.improvements : [],
    recommendation: rawReport.recommendation || 'Hold',
  };
}

export async function getEvaluationReportsApi() {
  const payload = await requestJson(`${API_BASE_URL}/evaluation-reports`);
  return payload.data.map(normalizeReport);
}

export async function createEvaluationReportApi(reportInput) {
  const payload = await requestJson(`${API_BASE_URL}/evaluation-reports`, {
    method: 'POST',
    body: JSON.stringify(reportInput),
  });

  return normalizeReport(payload.data);
}

export async function updateEvaluationReportApi(reportId, reportInput) {
  const payload = await requestJson(`${API_BASE_URL}/evaluation-reports/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify(reportInput),
  });

  return normalizeReport(payload.data);
}
