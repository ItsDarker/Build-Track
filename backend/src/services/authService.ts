import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '../config/prisma';
import { config } from '../config/env';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { isDisposableEmail, isLikelySpamDomain } from '../utils/emailValidation';
import { sendVerificationEmail } from './emailService';

const MAX_FAILED_ATTEMPTS = 10;
const ATTEMPT_WINDOW_HOURS = 1;

export interface SignupData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  async signup(data: SignupData): Promise<{ message: string }> {
    const { email, password, name } = data;

    // Validate email
    if (isDisposableEmail(email)) {
      throw new Error('Disposable email addresses are not allowed');
    }

    if (isLikelySpamDomain(email)) {
      throw new Error('This email domain appears suspicious');
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        throw new Error('An account with this email already exists');
      } else {
        throw new Error('Account exists but not verified. Please check your email or request a new verification link.');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
      },
    });

    // Generate verification token
    const token = randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.verificationTokenExpiresMinutes);

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash,
        expiresAt,
      },
    });

    // Send verification email
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;
    await sendVerificationEmail({
      to: user.email,
      name: user.name || undefined,
      verificationUrl,
    });

    return {
      message: 'Account created! Please check your email to verify your account.',
    };
  }

  async login(data: LoginData, ip: string): Promise<AuthTokens & { user: any }> {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      // Log failed attempt
      await prisma.loginAttempt.create({
        data: { email, ip, success: false },
      });
      throw new Error('Invalid credentials');
    }

    // Check if user is blocked
    if (user.isBlocked) {
      throw new Error('Your account has been blocked. Please contact support.');
    }

    if (!user.emailVerified) {
      throw new Error('Please verify your email before logging in');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      await prisma.loginAttempt.create({
        data: { email, ip, success: false, userId: user.id },
      });

      // Check for auto-block
      await this.checkAndAutoBlock(user.id, email);

      throw new Error('Invalid credentials');
    }

    // Log successful attempt
    await prisma.loginAttempt.create({
      data: { email, ip, success: true, userId: user.id },
    });

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        role: user.role,
      },
    };
  }

  /**
   * Check and auto-block user after too many failed attempts
   */
  private async checkAndAutoBlock(userId: string, email: string): Promise<void> {
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - ATTEMPT_WINDOW_HOURS);

    const failedAttempts = await prisma.loginAttempt.count({
      where: {
        userId,
        success: false,
        createdAt: { gte: windowStart },
      },
    });

    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      // Auto-block the user
      await prisma.user.update({
        where: { id: userId },
        data: {
          isBlocked: true,
          blockedAt: new Date(),
          blockedReason: `Automatically blocked after ${MAX_FAILED_ATTEMPTS} failed login attempts`,
        },
      });

      // Create admin notification
      await prisma.adminNotification.create({
        data: {
          type: 'auto_blocked',
          title: 'User Auto-Blocked',
          message: `User ${email} was automatically blocked after ${MAX_FAILED_ATTEMPTS} failed login attempts within ${ATTEMPT_WINDOW_HOURS} hour(s).`,
          data: JSON.stringify({ userId, email, failedAttempts }),
        },
      });
    }
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const tokenHash = hashToken(token);

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new Error('Invalid or expired verification link');
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });
      throw new Error('Verification link has expired');
    }

    // Verify user
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    return {
      message: 'Email verified successfully! You can now log in.',
    };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return {
        message: 'If an account exists with this email, a verification link has been sent.',
      };
    }

    if (user.emailVerified) {
      throw new Error('This email is already verified');
    }

    // Delete old tokens
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate new token
    const token = randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.verificationTokenExpiresMinutes);

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash,
        expiresAt,
      },
    });

    // Send email
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;
    await sendVerificationEmail({
      to: user.email,
      name: user.name || undefined,
      verificationUrl,
    });

    return {
      message: 'Verification email sent! Please check your inbox.',
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
      }
      throw new Error('Invalid or expired refresh token');
    }

    const accessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
    });

    return { accessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        role: true,
        isBlocked: true,
        createdAt: true,
      },
    });
  }
}

export const authService = new AuthService();
