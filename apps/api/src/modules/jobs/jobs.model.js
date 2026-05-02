const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		location: {
			type: String,
			required: true,
			trim: true,
		},
		experience: {
			type: String,
			required: true,
			trim: true,
		},
		type: {
			type: String,
			enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
			default: 'Full-time',
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		status: {
			type: String,
			enum: ['Open', 'Closed'],
			default: 'Open',
		},
	},
	{
		timestamps: true,
	},
);

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
