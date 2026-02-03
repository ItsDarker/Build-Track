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

export default router;
