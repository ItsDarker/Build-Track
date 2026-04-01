import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env first, then .env.local if it exists (for local development overrides)
dotenv.config();
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
}

export const config = {
  port: parseInt(process.env.PORT || '4000'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'development-jwt-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // OAuth - Google
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/auth/oauth/google/callback',
  },

  // OAuth - Microsoft
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
    redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:4000/api/auth/oauth/microsoft/callback',
  },

  // Email
  mail: {
    mode: process.env.MAIL_MODE || 'console',
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.SMTP_FROM || 'noreply@buildtrack.local',
  },

  // Verification
  verificationTokenExpiresMinutes: parseInt(process.env.VERIFICATION_TOKEN_EXPIRES_MINUTES || '60'),

  // Rate limiting
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // Increased for testing
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  },

  // Cookies
  cookie: {
    domain: process.env.COOKIE_DOMAIN || 'localhost',
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: (process.env.COOKIE_SAME_SITE || 'lax') as 'strict' | 'lax' | 'none',
  },

  // Google Drive
  googleDrive: {
    enabled: process.env.GOOGLE_DRIVE_ENABLED === 'true',
    serviceAccountEmail: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL || '',
    serviceAccountPrivateKeyId: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY_ID || '',
    serviceAccountPrivateKey: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    serviceAccountProjectId: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PROJECT_ID || '',
    uploadsFolderId: process.env.GOOGLE_DRIVE_UPLOADS_FOLDER_ID || '',
  },
  // Redis configuration for Socket.io scaling
  redisUrl: process.env.REDIS_URL || '',
} as const;
