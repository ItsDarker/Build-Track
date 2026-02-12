import { prisma } from "../lib/prisma";
import { OAuth2Client } from "google-auth-library";
import { Router } from 'express';
import { authService } from '../services/authService';
import { rateLimiter } from '../middleware/rateLimiter';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  validate,
} from '../utils/validation';
import { config } from '../config/env';
const router = Router();

import type { Response } from "express";

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: 15 * 60 * 1000,
    domain: config.cookie.domain === "localhost" ? undefined : config.cookie.domain,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    domain: config.cookie.domain === "localhost" ? undefined : config.cookie.domain,
  });
}


// Signup
router.post('/signup', rateLimiter('signup'), async (req, res) => {
  try {
    const data = validate(signupSchema)(req.body);
    const result = await authService.signup(data);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message || 'Signup failed' });
  }
});

// Login
router.post('/login', rateLimiter('login'), async (req, res) => {
  try {
    const data = validate(loginSchema)(req.body);
    const ip = req.ip || 'unknown';
    const result = await authService.login(data, ip);

    // Set cookies
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: 15 * 60 * 1000, // 15 minutes
      domain: config.cookie.domain === 'localhost' ? undefined : config.cookie.domain,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: config.cookie.domain === 'localhost' ? undefined : config.cookie.domain,
    });

    res.json({
      message: 'Login successful',
      user: result.user,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message || 'Login failed' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const data = validate(verifyEmailSchema)(req.body);
    const result = await authService.verifyEmail(data.token);
    res.json(result);
  } catch (error: any) {
    console.error('Verification error:', error);
    res.status(400).json({ error: error.message || 'Verification failed' });
  }
});

// Resend verification
router.post(
  '/resend-verification',
  rateLimiter('resend-verification', { max: 3, windowMs: 3600000 }),
  async (req, res) => {
    try {
      const data = validate(resendVerificationSchema)(req.body);
      const result = await authService.resendVerification(data.email);
      res.json(result);
    } catch (error: any) {
      console.error('Resend verification error:', error);
      res.status(400).json({ error: error.message || 'Resend failed' });
    }
  }
);

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    // Set new access token cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: 15 * 60 * 1000,
      domain: config.cookie.domain === 'localhost' ? undefined : config.cookie.domain,
    });

    res.json({ message: 'Token refreshed' });
  } catch (error: any) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: error.message || 'Token refresh failed' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Clear cookies
    res.clearCookie('accessToken', {
      domain: config.cookie.domain === 'localhost' ? undefined : config.cookie.domain,
    });
    res.clearCookie('refreshToken', {
      domain: config.cookie.domain === 'localhost' ? undefined : config.cookie.domain,
    });

    res.json({ message: 'Logout successful' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user (protected route)
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await authService.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});
// --- Google OAuth ---
router.get("/oauth/google", (req, res) => {
  const { clientId, redirectUri } = config.google;

  if (!clientId || clientId === "__PENDING__") {
    return res.status(500).json({
      error: "Google OAuth not configured: missing GOOGLE_CLIENT_ID",
    });
  }

  const client = new OAuth2Client(clientId, undefined, redirectUri);

  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["openid", "email", "profile"],
  });

  return res.redirect(url);
});

router.get("/oauth/google/callback", async (req, res) => {
  try {
    const code = req.query.code as string | undefined;
    if (!code) return res.status(400).json({ error: "Missing code" });

    const { clientId, clientSecret, redirectUri } = config.google;

    if (
      !clientId || clientId === "__PENDING__" ||
      !clientSecret || clientSecret === "__PENDING__"
    ) {
      return res.status(500).json({
        error: "Google OAuth not configured: missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET",
      });
    }

    const client = new OAuth2Client(clientId, clientSecret, redirectUri);

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const idToken = tokens.id_token;
    if (!idToken) return res.status(400).json({ error: "Missing id_token from Google" });

    const ticket = await client.verifyIdToken({ idToken, audience: clientId });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const name = payload?.name || payload?.given_name || "User";

    if (!email) return res.status(400).json({ error: "Google account did not provide an email" });

    // 1) Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          emailVerified: new Date(),
          role: "SUBCONTRACTOR",
        },
      });
    }

    // 2) Issue tokens using your existing auth service
    const result = await authService.loginWithOAuth(user.id);

    // 3) Set cookies
    setAuthCookies(res, result.accessToken, result.refreshToken);

    // 4) Redirect to app (or admin)
    const dest = result.user?.role === "ADMIN" ? "/admin" : "/app";
    return res.redirect(`${config.frontendUrl}${dest}`);
  } catch (error: any) {
    console.error("Google OAuth error:", error);
    return res.status(500).json({ error: error.message || "Google OAuth failed" });
  }
});



export default router;
