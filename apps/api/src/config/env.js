const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envCandidates = [
  path.join(process.cwd(), 'apps', 'api', '.env'),
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '..', '..', '.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/talentmatch',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'change-this-access-secret',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  jwtRefreshCookieName: process.env.JWT_REFRESH_COOKIE_NAME || 'tm_refresh_token',
  jwtRefreshCookieMaxAgeMs: Number(process.env.JWT_REFRESH_COOKIE_MAX_AGE_MS || 604800000),
  authMaxFailedLoginAttempts: Number(process.env.AUTH_MAX_FAILED_LOGIN_ATTEMPTS || 5),
  authLockoutMinutes: Number(process.env.AUTH_LOCKOUT_MINUTES || 30),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  aiRequestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS || 20000),
  aiEnableHeuristicFallback: process.env.AI_ENABLE_HEURISTIC_FALLBACK !== 'false',
};

module.exports = env;