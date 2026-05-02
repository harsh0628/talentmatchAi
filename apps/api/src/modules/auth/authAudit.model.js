const mongoose = require('mongoose');

const authAuditSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			default: null,
			index: true,
		},
		eventType: {
			type: String,
			required: true,
			enum: [
				'register_success',
				'login_success',
				'login_failed',
				'login_locked',
				'refresh_success',
				'logout_success',
				'refresh_reuse_detected',
			],
			index: true,
		},
		ipAddress: {
			type: String,
			default: '',
		},
		userAgent: {
			type: String,
			default: '',
		},
		meta: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
	},
	{
		timestamps: true,
	},
);

const AuthAudit = mongoose.model('AuthAudit', authAuditSchema);

module.exports = AuthAudit;
