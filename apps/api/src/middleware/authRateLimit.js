const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 12,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
	},
});

const refreshLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 40,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		message: 'Too many refresh attempts from this IP. Please try again in 15 minutes.',
	},
});

module.exports = {
	loginLimiter,
	refreshLimiter,
};
