const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		tokenId: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		expiresAt: {
			type: Date,
			required: true,
		},
		revokedAt: {
			type: Date,
			default: null,
		},
		replacedByTokenId: {
			type: String,
			default: null,
		},
		createdByIp: {
			type: String,
			default: '',
		},
		userAgent: {
			type: String,
			default: '',
		},
	},
	{
		timestamps: true,
	},
);

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
