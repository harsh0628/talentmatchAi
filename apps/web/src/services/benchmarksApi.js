import { API_BASE_URL, requestJson } from './apiClient';

const BASE_URL = '/benchmarks';

export async function getBenchmarks(filters = {}) {
	const params = new URLSearchParams();
	if (filters.category) params.append('category', filters.category);
	if (filters.difficulty) params.append('difficulty', filters.difficulty);

	const query = params.toString() ? `?${params.toString()}` : '';
	const payload = await requestJson(`${API_BASE_URL}${BASE_URL}${query}`);
	return payload.data;
}

export async function createBenchmark(data) {
	const payload = await requestJson(`${API_BASE_URL}${BASE_URL}`, {
		method: 'POST',
		body: JSON.stringify(data),
	});
	return payload.data;
}

export async function getBenchmarkStats() {
	const payload = await requestJson(`${API_BASE_URL}${BASE_URL}/stats`);
	return payload.data;
}

/**
 * Run evaluation against all benchmarks
 * @param {Object} options - { category, difficulty, scoringMethod }
 */
export async function evaluateBenchmarks(options = {}) {
	const payload = await requestJson(`${API_BASE_URL}${BASE_URL}/evaluate`, {
		method: 'POST',
		body: JSON.stringify({
			category: options.category,
			difficulty: options.difficulty,
			scoringMethod: options.scoringMethod || 'gemini',
		}),
	});
	return payload.data;
}

/**
 * Batch create benchmarks (admin only)
 * @param {Array} benchmarks - Array of benchmark objects
 */
export async function batchCreateBenchmarks(benchmarks) {
	const payload = await requestJson(`${API_BASE_URL}${BASE_URL}/batch`, {
		method: 'POST',
		body: JSON.stringify({ benchmarks }),
	});
	return payload.data;
}
