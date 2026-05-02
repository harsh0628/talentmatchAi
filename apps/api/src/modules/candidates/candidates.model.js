const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		role: {
			type: String,
			required: true,
			trim: true,
		},
		score: {
			type: Number,
			required: true,
			min: 0,
			max: 100,
		},
		stage: {
			type: String,
			required: true,
			enum: ['Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'],
		},
		email: {
			type: String,
			trim: true,
		},
	},
	{
		timestamps: true,
	},
);

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;
