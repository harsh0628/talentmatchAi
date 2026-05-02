import { API_BASE_URL, requestJson } from './apiClient';

function normalizeJob(rawJob) {
  return {
    id: rawJob._id,
    title: rawJob.title,
    location: rawJob.location,
    experience: rawJob.experience,
    type: rawJob.type,
    description: rawJob.description,
    status: rawJob.status,
  };
}

export async function getJobsApi() {
  const payload = await requestJson(`${API_BASE_URL}/jobs`);
  return payload.data.map(normalizeJob);
}

export async function createJobApi(jobInput) {
  const payload = await requestJson(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    body: JSON.stringify(jobInput),
  });

  return normalizeJob(payload.data);
}

export async function updateJobApi(jobId, jobInput) {
  const payload = await requestJson(`${API_BASE_URL}/jobs/${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify(jobInput),
  });

  return normalizeJob(payload.data);
}

export async function deleteJobApi(jobId) {
  await requestJson(`${API_BASE_URL}/jobs/${jobId}`, {
    method: 'DELETE',
  });
}
