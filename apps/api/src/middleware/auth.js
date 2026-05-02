const jwt = require('jsonwebtoken');
const env = require('../config/env');

function parseBearerToken(authHeaderValue) {
	if (!authHeaderValue || !authHeaderValue.startsWith('Bearer ')) {
		return null;
	}

	return authHeaderValue.slice(7).trim();
}

function requireAuth(req, res, next) {
	const token = parseBearerToken(req.headers.authorization);

	if (!token) {
		return res.status(401).json({ success: false, message: 'Authorization token is missing' });
	}

	try {
		const decoded = jwt.verify(token, env.jwtAccessSecret);
		req.user = {
			id: decoded.sub,
			email: decoded.email,
			role: decoded.role,
			name: decoded.name,
		};
		return next();
	} catch (error) {
		return res.status(401).json({ success: false, message: 'Invalid or expired token' });
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
