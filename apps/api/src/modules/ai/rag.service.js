const Job = require('../jobs/jobs.model');
const Candidate = require('../candidates/candidates.model');
const mongoose = require('mongoose');

const STOP_WORDS = new Set([
	'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'is', 'it', 'of', 'on',
	'or', 'that', 'the', 'to', 'with', 'will', 'you', 'your', 'we', 'our', 'this', 'these', 'those',
	'job', 'position', 'role', 'candidate', 'experience', 'must', 'have', 'should', 'skill', 'skills',
]);

function extractKeywords(...segments) {
	return [...new Set(
		segments
			.join(' ')
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, ' ')
			.split(/\s+/)
			.filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
	)];
}

function parseSkills(input = '') {
	return String(input)
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

function calculateOverlapScore(keywords, text) {
	const docKeywords = extractKeywords(text);
	if (keywords.length === 0 || docKeywords.length === 0) {
		return 0;
	}

	const matches = keywords.filter((keyword) => docKeywords.includes(keyword)).length;
	return matches / Math.max(keywords.length, 1);
}

function summarizeJob(job) {
	return {
		id: String(job._id),
		title: job.title,
		location: job.location,
		experience: job.experience,
		type: job.type,
		description: job.description,
		overlapScore: job.overlapScore,
	};
}

function summarizeCandidate(candidate) {
	return {
		id: String(candidate._id),
		name: candidate.name,
		role: candidate.role,
		score: candidate.score,
		stage: candidate.stage,
		email: candidate.email,
		overlapScore: candidate.overlapScore,
	};
}

function buildRagContextPayload(payload = {}) {
	return extractKeywords(
		payload.jobTitle,
		payload.jobDescription,
		payload.requiredSkills,
		payload.candidateName,
		payload.candidateRole,
		payload.candidateSkills,
		payload.candidateSummary,
	);
}

function formatSourceList(title, items) {
	if (!items.length) {
		return `${title}: none found`;
	}

	return [title, ...items.map((item, index) => {
		if (item.title) {
			return `${index + 1}. ${item.title} | ${item.location} | ${item.experience} | overlap ${Math.round(item.overlapScore * 100)}%`;
		}

		return `${index + 1}. ${item.name} | ${item.role} | stage ${item.stage} | overlap ${Math.round(item.overlapScore * 100)}%`;
	})].join('\n');
}

const FALLBACK_JOBS = [
	{
		title: 'Backend Engineer',
		location: 'Remote',
		experience: '3-5 years',
		type: 'Full-time',
		description: 'Build Node.js APIs, manage MongoDB data, and support hiring workflows.',
	},
	{
		title: 'Frontend Developer',
		location: 'Bengaluru',
		experience: '2-4 years',
		type: 'Full-time',
		description: 'Create React interfaces and connect recruitment dashboards to APIs.',
	},
	{
		title: 'DevOps Engineer',
		location: 'Hybrid',
		experience: '4-6 years',
		type: 'Contract',
		description: 'Maintain Docker, CI/CD, observability, and cloud delivery pipelines.',
	},
];

const FALLBACK_CANDIDATES = [
	{
		name: 'Aarav Sharma',
		role: 'Backend Developer',
		score: 88,
		stage: 'Shortlisted',
		email: 'aarav.sharma@example.com',
	},
	{
		name: 'Neha Joshi',
		role: 'Frontend Developer',
		score: 82,
		stage: 'Interview Scheduled',
		email: 'neha.joshi@example.com',
	},
	{
		name: 'Vikram Patel',
		role: 'DevOps Engineer',
		score: 90,
		stage: 'Selected',
		email: 'vikram.patel@example.com',
	},
];

async function buildRagContext(payload = {}) {
	const keywords = buildRagContextPayload(payload);
	if (keywords.length === 0) {
		return {
			enabled: false,
			keywords: [],
			topJobs: [],
			topCandidates: [],
			contextText: '',
			note: 'RAG skipped because no searchable keywords were available.',
		};
	}

	let jobs = [];
	let candidates = [];
	let source = 'mongodb';

	if (mongoose.connection.readyState !== 1) {
		source = 'fallback';
		jobs = FALLBACK_JOBS;
		candidates = FALLBACK_CANDIDATES;
	} else {
		try {
		[jobs, candidates] = await Promise.all([
			Job.find({ status: 'Open' }).lean(),
			Candidate.find({}).lean(),
		]);
		} catch (error) {
			source = 'fallback';
			jobs = FALLBACK_JOBS;
			candidates = FALLBACK_CANDIDATES;
		}
	}

	const rankedJobs = jobs
		.map((job) => ({
			...job,
			overlapScore: calculateOverlapScore(keywords, `${job.title} ${job.description} ${job.location} ${job.experience} ${job.type}`),
		}))
		.filter((job) => job.overlapScore > 0)
		.sort((a, b) => b.overlapScore - a.overlapScore)
		.slice(0, 3);

	const rankedCandidates = candidates
		.map((candidate) => ({
			...candidate,
			overlapScore: calculateOverlapScore(keywords, `${candidate.name} ${candidate.role} ${candidate.stage} ${candidate.email}`),
		}))
		.filter((candidate) => candidate.overlapScore > 0)
		.sort((a, b) => b.overlapScore - a.overlapScore)
		.slice(0, 3);

	const topJobs = rankedJobs.map(summarizeJob);
	const topCandidates = rankedCandidates.map(summarizeCandidate);

	return {
		enabled: true,
		keywords,
		topJobs,
		topCandidates,
		source,
		contextText: [
			'Internal RAG context from existing database records.',
			formatSourceList('Top related jobs', topJobs),
			formatSourceList('Top related candidates', topCandidates),
		].join('\n\n'),
		note: source === 'mongodb'
			? 'RAG context retrieved from MongoDB jobs and candidates collections.'
			: 'RAG fallback context used because MongoDB was unavailable.',
	};
}

module.exports = {
	buildRagContext,
};