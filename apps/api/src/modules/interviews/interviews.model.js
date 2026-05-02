const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
	{
		date: {
			type: String,
			required: true,
			trim: true,
		},
		candidate: {
			type: String,
			required: true,
			trim: true,
		},
		panel: {
			type: String,
			required: true,
			trim: true,
		},
		mode: {
			type: String,
			required: true,
			enum: ['Online', 'Onsite'],
		},
		status: {
			type: String,
			required: true,
			enum: ['Scheduled', 'Completed', 'Cancelled'],
			default: 'Scheduled',
		},
	},
	{
		timestamps: true,
	},
);

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;
