const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		passwordHash: {
			type: String,
			required: true,
		},
		failedLoginAttempts: {
			type: Number,
			default: 0,
		},
		lockUntil: {
			type: Date,
			default: null,
		},
		refreshTokenHash: {
			type: String,
			default: null,
		},
		role: {
			type: String,
			required: true,
			enum: ['Admin', 'Recruiter', 'Interviewer'],
			default: 'Recruiter',
		},
	},
	{
		timestamps: true,
	},
);

const User = mongoose.model('User', userSchema);

module.exports = User;
