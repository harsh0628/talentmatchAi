const authService = require('./auth.service');
const env = require('../../config/env');

function buildRequestContext(req) {
	return {
		ipAddress: req.ip,
		userAgent: req.headers['user-agent'] || '',
		requestId: req.requestId || '',
	};
}

function setSessionCookie(res, sessionId) {
	res.cookie(env.sessionCookieName, sessionId, {
		httpOnly: true,
		secure: env.sessionCookieSecure,
		sameSite: 'lax',
		maxAge: env.sessionMaxAgeMs,
		path: '/',
	});
}

function clearSessionCookie(res) {
	res.clearCookie(env.sessionCookieName, {
		httpOnly: true,
		secure: env.sessionCookieSecure,
		sameSite: 'lax',
		path: '/',
	});
}

function validateRegister(body) {
	const missing = [];

	if (!body.name) {
		missing.push('name');
	}
	if (!body.email) {
		missing.push('email');
	}
	if (!body.password) {
		missing.push('password');
	}

	return missing;
}

function validateLogin(body) {
	const missing = [];

	if (!body.email) {
		missing.push('email');
	}
	if (!body.password) {
		missing.push('password');
	}

	return missing;
}

async function register(req, res, next) {
	try {
		const missing = validateRegister(req.body);
		if (missing.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Missing required fields: ${missing.join(', ')}`,
			});
		}

		const result = await authService.registerUser(req.body, buildRequestContext(req));
		setSessionCookie(res, result.sessionId);

		return res.status(201).json({
			success: true,
			message: 'User registered successfully',
			data: {
				user: result.user,
			},
		});
	} catch (error) {
		next(error);
	}
}

async function login(req, res, next) {
	try {
		const missing = validateLogin(req.body);
		if (missing.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Missing required fields: ${missing.join(', ')}`,
			});
		}

		const result = await authService.loginUser(req.body, buildRequestContext(req));
		setSessionCookie(res, result.sessionId);

		return res.status(200).json({
			success: true,
			message: 'Login successful',
			data: {
				user: result.user,
			},
		});
	} catch (error) {
		next(error);
	}
}

async function logout(req, res, next) {
	try {
		const sessionId = req.cookies?.[env.sessionCookieName];
		await authService.clearSession(sessionId, req.user.id, buildRequestContext(req));
		clearSessionCookie(res);

		return res.status(200).json({
			success: true,
			message: 'Logged out successfully',
			data: null,
		});
	} catch (error) {
		next(error);
	}
}

async function checkEmail(req, res, next) {
	try {
		const result = await authService.checkEmailAvailability(req.query.email);

		return res.status(200).json({
			success: true,
			message: 'Email availability fetched successfully',
			data: result,
		});
	} catch (error) {
		next(error);
	}
}

async function getAuthAuditEvents(req, res, next) {
	try {
		const events = await authService.listAuthAuditEvents(req.query.limit);

		return res.status(200).json({
			success: true,
			message: 'Auth audit events fetched successfully',
			data: events,
		});
	} catch (error) {
		next(error);
	}
}

async function me(req, res, next) {
	try {
		const user = await authService.getUserById(req.user.id);
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		return res.status(200).json({
			success: true,
			message: 'User profile fetched successfully',
			data: user,
		});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	register,
	login,
	logout,
	checkEmail,
	getAuthAuditEvents,
	me,
};
