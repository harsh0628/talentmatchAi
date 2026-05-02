const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const User = require('./users.model');
const RefreshToken = require('./refreshTokens.model');
const AuthAudit = require('./authAudit.model');
const env = require('../../config/env');

const MAX_FAILED_LOGIN_ATTEMPTS = Number.isFinite(env.authMaxFailedLoginAttempts)
	? Math.max(env.authMaxFailedLoginAttempts, 1)
	: 5;
const LOGIN_LOCKOUT_MS = Number.isFinite(env.authLockoutMinutes)
	? Math.max(env.authLockoutMinutes, 1) * 60 * 1000
	: 30 * 60 * 1000;

function isStrongPassword(password) {
	const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
	return passwordRule.test(password);
}

function buildTokenPayload(user) {
	return {
		sub: user._id.toString(),
		email: user.email,
		role: user.role,
		name: user.name,
	};
}

function signAccessToken(user) {
	return jwt.sign(buildTokenPayload(user), env.jwtAccessSecret, {
		expiresIn: env.jwtAccessExpiresIn,
	});
}

function signRefreshToken(user, tokenId) {
	return jwt.sign({ ...buildTokenPayload(user), jti: tokenId }, env.jwtRefreshSecret, {
		expiresIn: env.jwtRefreshExpiresIn,
	});
}

function sanitizeUser(user) {
	return {
		id: user._id.toString(),
		name: user.name,
		email: user.email,
		role: user.role,
	};
}

async function buildSessionTokens(user) {
	const refreshTokenId = randomUUID();
	const accessToken = signAccessToken(user);
	const refreshToken = signRefreshToken(user, refreshTokenId);
	const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
	const decodedRefreshToken = jwt.decode(refreshToken);
	const expiresAt = decodedRefreshToken?.exp ? new Date(decodedRefreshToken.exp * 1000) : new Date(Date.now() + env.jwtRefreshCookieMaxAgeMs);

	await User.findByIdAndUpdate(user._id, { refreshTokenHash });
	await RefreshToken.create({
		userId: user._id,
		tokenId: refreshTokenId,
		expiresAt,
	});

	return {
		user: sanitizeUser(user),
		accessToken,
		refreshToken,
		refreshTokenId,
	};
}

async function writeAuditEvent(eventType, userId, context = {}, meta = {}) {
	await AuthAudit.create({
		eventType,
		userId: userId || null,
		ipAddress: context.ipAddress || '',
		userAgent: context.userAgent || '',
		meta: {
			requestId: context.requestId || '',
			...meta,
		},
	});
}

async function registerUser(payload, context = {}) {
	const email = String(payload.email || '').toLowerCase().trim();
	const password = String(payload.password || '');
	const name = String(payload.name || '').trim();
	const role = payload.role || 'Recruiter';

	if (!isStrongPassword(password)) {
		const error = new Error(
			'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
		);
		error.statusCode = 400;
		throw error;
	}

	const existingUser = await User.findOne({ email });
	if (existingUser) {
		const error = new Error('Email already registered');
		error.statusCode = 409;
		throw error;
	}

	const passwordHash = await bcrypt.hash(password, 10);
	const createdUser = await User.create({ name, email, passwordHash, role });
	const result = await buildSessionTokens(createdUser);
	await writeAuditEvent('register_success', createdUser._id, context, { role: createdUser.role });

	return result;
}

async function loginUser(payload, context = {}) {
	const email = String(payload.email || '').toLowerCase().trim();
	const password = String(payload.password || '');

	const user = await User.findOne({ email });
	if (!user) {
		await writeAuditEvent('login_failed', null, context, {
			email,
			reason: 'user_not_found',
		});

		const error = new Error('Invalid email or password');
		error.statusCode = 401;
		throw error;
	}

	if (user.lockUntil && user.lockUntil > new Date()) {
		await writeAuditEvent('login_locked', user._id, context, {
			email,
			lockUntil: user.lockUntil,
		});

		const error = new Error('Account is temporarily locked. Please try again later.');
		error.statusCode = 423;
		throw error;
	}

	const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
	if (!isPasswordValid) {
		const nextFailedAttempts = (user.failedLoginAttempts || 0) + 1;
		const shouldLock = nextFailedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
		const lockUntil = shouldLock ? new Date(Date.now() + LOGIN_LOCKOUT_MS) : null;

		await User.findByIdAndUpdate(user._id, {
			failedLoginAttempts: shouldLock ? 0 : nextFailedAttempts,
			lockUntil,
		});

		await writeAuditEvent('login_failed', user._id, context, {
			email,
			failedAttempts: nextFailedAttempts,
			locked: shouldLock,
			lockUntil,
			reason: 'invalid_password',
		});

		const error = new Error('Invalid email or password');
		error.statusCode = 401;
		throw error;
	}

	if (user.failedLoginAttempts > 0 || user.lockUntil) {
		await User.findByIdAndUpdate(user._id, {
			failedLoginAttempts: 0,
			lockUntil: null,
		});
	}

	const result = await buildSessionTokens(user);
	await writeAuditEvent('login_success', user._id, context);
	return result;
}

async function getUserById(userId) {
	const user = await User.findById(userId);
	if (!user) {
		return null;
	}

	return sanitizeUser(user);
}

async function revokeAllUserRefreshSessions(userId) {
	await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
	await RefreshToken.updateMany(
		{ userId, revokedAt: null },
		{ $set: { revokedAt: new Date() } },
	);
}

async function refreshSession(refreshToken, context = {}) {
	let decoded;
	try {
		decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
	} catch (error) {
		const authError = new Error('Invalid or expired refresh token');
		authError.statusCode = 401;
		throw authError;
	}

	const user = await User.findById(decoded.sub);
	if (!user || !user.refreshTokenHash) {
		const authError = new Error('Invalid refresh session');
		authError.statusCode = 401;
		throw authError;
	}

	const existingSession = await RefreshToken.findOne({ tokenId: decoded.jti, userId: user._id });
	if (!existingSession || existingSession.revokedAt || existingSession.expiresAt < new Date()) {
		await revokeAllUserRefreshSessions(user._id);
		await writeAuditEvent('refresh_reuse_detected', user._id, context, {
			reason: 'missing_or_revoked_refresh_session',
			tokenId: decoded.jti || null,
		});

		const authError = new Error('Refresh token reuse detected. Please login again');
		authError.statusCode = 401;
		throw authError;
	}

	const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
	if (!isRefreshTokenValid) {
		await revokeAllUserRefreshSessions(user._id);
		await writeAuditEvent('refresh_reuse_detected', user._id, context, {
			reason: 'refresh_token_hash_mismatch',
			tokenId: decoded.jti || null,
		});

		const authError = new Error('Refresh token reuse detected. Please login again');
		authError.statusCode = 401;
		throw authError;
	}

	const rotatedSession = await buildSessionTokens(user);
	existingSession.revokedAt = new Date();
	existingSession.replacedByTokenId = rotatedSession.refreshTokenId;
	await existingSession.save();

	await writeAuditEvent('refresh_success', user._id, context, {
		fromTokenId: decoded.jti || null,
		toTokenId: rotatedSession.refreshTokenId,
	});

	return rotatedSession;
}

async function clearRefreshSession(userId, refreshToken, context = {}) {
	let tokenId = null;
	if (refreshToken) {
		const decoded = jwt.decode(refreshToken);
		tokenId = decoded?.jti || null;
	}

	await revokeAllUserRefreshSessions(userId);

	if (tokenId) {
		await RefreshToken.updateOne(
			{ userId, tokenId },
			{ $set: { revokedAt: new Date() } },
		);
	}

	await writeAuditEvent('logout_success', userId, context, {
		tokenId,
	});
}

async function checkEmailAvailability(emailInput) {
	const email = String(emailInput || '').toLowerCase().trim();
	if (!email) {
		return { available: false };
	}

	const existingUser = await User.findOne({ email });
	return { available: !existingUser };
}

async function listAuthAuditEvents(limit = 50) {
	const maxLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
	const events = await AuthAudit.find()
		.sort({ createdAt: -1 })
		.limit(maxLimit)
		.populate('userId', 'name email role');

	return events.map((event) => ({
		id: event._id.toString(),
		eventType: event.eventType,
		ipAddress: event.ipAddress,
		userAgent: event.userAgent,
		meta: event.meta,
		createdAt: event.createdAt,
		user: event.userId
			? {
				id: event.userId._id.toString(),
				name: event.userId.name,
				email: event.userId.email,
				role: event.userId.role,
			}
			: null,
	}));
}

module.exports = {
	registerUser,
	loginUser,
	getUserById,
	refreshSession,
	clearRefreshSession,
	checkEmailAvailability,
	listAuthAuditEvents,
};
