const crypto = require('crypto');
const env = require('../config/env');
const User = require('../modules/auth/users.model');
const AuthSession = require('../modules/auth/authSessions.model');

function hashSessionId(sessionId) {
	return crypto.createHash('sha256').update(sessionId).digest('hex');
}

async function requireAuth(req, res, next) {
	const sessionId = req.cookies?.[env.sessionCookieName];
	if (!sessionId) {
		return res.status(401).json({ success: false, message: 'Login is required' });
	}

	try {
		const session = await AuthSession.findOne({
			sessionHash: hashSessionId(sessionId),
			expiresAt: { $gt: new Date() },
		});
		if (!session) {
			return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
		}

		const user = await User.findById(session.userId);
		if (!user) {
			return res.status(401).json({ success: false, message: 'User account not found' });
		}

		req.user = {
			id: user._id.toString(),
			email: user.email,
			role: user.role,
			name: user.name,
		};
		return next();
	} catch (error) {
		return next(error);
	}
}

function allowRoles(...allowedRoles) {
	return function roleGuard(req, res, next) {
		if (!req.user) {
			return res.status(401).json({ success: false, message: 'Unauthorized' });
		}

		if (!allowedRoles.includes(req.user.role)) {
			return res.status(403).json({ success: false, message: 'Forbidden for this role' });
		}

		return next();
	};
}

module.exports = {
	requireAuth,
	allowRoles,
};
