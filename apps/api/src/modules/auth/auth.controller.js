const authService = require('./auth.service');
const env = require('../../config/env');

function buildRequestContext(req) {
	return {
		ipAddress: req.ip,
		userAgent: req.headers['user-agent'] || '',
		requestId: req.requestId || '',
	};
}

function setRefreshCookie(res, refreshToken) {
	res.cookie(env.jwtRefreshCookieName, refreshToken, {
		httpOnly: true,
		secure: env.nodeEnv === 'production',
		sameSite: 'lax',
		maxAge: env.jwtRefreshCookieMaxAgeMs,
		path: '/api/auth',
	});
}

function clearRefreshCookie(res) {
	res.clearCookie(env.jwtRefreshCookieName, {
		httpOnly: true,
		secure: env.nodeEnv === 'production',
		sameSite: 'lax',
		path: '/api/auth',
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
		setRefreshCookie(res, result.refreshToken);

		return res.status(201).json({
			success: true,
			message: 'User registered successfully',
			data: {
				user: result.user,
				accessToken: result.accessToken,
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
		setRefreshCookie(res, result.refreshToken);

		return res.status(200).json({
			success: true,
			message: 'Login successful',
			data: {
				user: result.user,
				accessToken: result.accessToken,
			},
		});
	} catch (error) {
		next(error);
	}
}

async function refresh(req, res, next) {
	try {
		const refreshToken = req.cookies?.[env.jwtRefreshCookieName];
		if (!refreshToken) {
			return res.status(401).json({ success: false, message: 'Refresh token is missing' });
		}

		const result = await authService.refreshSession(refreshToken, buildRequestContext(req));
		setRefreshCookie(res, result.refreshToken);

		return res.status(200).json({
			success: true,
			message: 'Access token refreshed successfully',
			data: {
				user: result.user,
				accessToken: result.accessToken,
			},
		});
	} catch (error) {
		next(error);
	}
}

async function logout(req, res, next) {
	try {
		const refreshToken = req.cookies?.[env.jwtRefreshCookieName];
		await authService.clearRefreshSession(req.user.id, refreshToken, buildRequestContext(req));
		clearRefreshCookie(res);

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
	refresh,
	logout,
	checkEmail,
	getAuthAuditEvents,
	me,
};
