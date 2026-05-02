const express = require('express');
const authController = require('./auth.controller');
const { allowRoles, requireAuth } = require('../../middleware/auth');
const { loginLimiter, refreshLimiter } = require('../../middleware/authRateLimit');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.get('/check-email', authController.checkEmail);
router.get('/me', requireAuth, authController.me);
router.post('/logout', requireAuth, authController.logout);
router.get('/audit-events', requireAuth, allowRoles('Admin'), authController.getAuthAuditEvents);

module.exports = router;
