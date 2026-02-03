"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const prisma_1 = require("../config/prisma");
const env_1 = require("../config/env");
const jwt_1 = require("../utils/jwt");
const emailValidation_1 = require("../utils/emailValidation");
const emailService_1 = require("./emailService");
function hashToken(token) {
    return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
}
class AuthService {
    async signup(data) {
        const { email, password, name } = data;
        // Validate email
        if ((0, emailValidation_1.isDisposableEmail)(email)) {
            throw new Error('Disposable email addresses are not allowed');
        }
        if ((0, emailValidation_1.isLikelySpamDomain)(email)) {
            throw new Error('This email domain appears suspicious');
        }
        // Check if user exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            if (existingUser.emailVerified) {
                throw new Error('An account with this email already exists');
            }
            else {
                throw new Error('Account exists but not verified. Please check your email or request a new verification link.');
            }
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        // Create user
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                name: name || null,
                passwordHash,
            },
        });
        // Generate verification token
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = hashToken(token);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + env_1.config.verificationTokenExpiresMinutes);
        await prisma_1.prisma.verificationToken.create({
            data: {
                userId: user.id,
                email: user.email,
                tokenHash,
                expiresAt,
            },
        });
        // Send verification email
        const verificationUrl = `${env_1.config.frontendUrl}/verify-email?token=${token}`;
        await (0, emailService_1.sendVerificationEmail)({
            to: user.email,
            name: user.name || undefined,
            verificationUrl,
        });
        return {
            message: 'Account created! Please check your email to verify your account.',
        };
    }
    async login(data, ip) {
        const { email, password } = data;
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user || !user.passwordHash) {
            // Log failed attempt
            await prisma_1.prisma.loginAttempt.create({
                data: { email, ip, success: false },
            });
            throw new Error('Invalid credentials');
        }
        if (!user.emailVerified) {
            throw new Error('Please verify your email before logging in');
        }
        // Verify password
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            await prisma_1.prisma.loginAttempt.create({
                data: { email, ip, success: false, userId: user.id },
            });
            throw new Error('Invalid credentials');
        }
        // Log successful attempt
        await prisma_1.prisma.loginAttempt.create({
            data: { email, ip, success: true, userId: user.id },
        });
        // Generate tokens
        const accessToken = (0, jwt_1.generateAccessToken)({ userId: user.id, email: user.email });
        const refreshToken = (0, jwt_1.generateRefreshToken)({ userId: user.id, email: user.email });
        // Store refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        await prisma_1.prisma.refreshToken.create({
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
            },
        };
    }
    async verifyEmail(token) {
        const tokenHash = hashToken(token);
        const verificationToken = await prisma_1.prisma.verificationToken.findUnique({
            where: { tokenHash },
            include: { user: true },
        });
        if (!verificationToken) {
            throw new Error('Invalid or expired verification link');
        }
        if (verificationToken.expiresAt < new Date()) {
            await prisma_1.prisma.verificationToken.delete({
                where: { id: verificationToken.id },
            });
            throw new Error('Verification link has expired');
        }
        // Verify user
        await prisma_1.prisma.user.update({
            where: { id: verificationToken.userId },
            data: { emailVerified: new Date() },
        });
        // Delete used token
        await prisma_1.prisma.verificationToken.delete({
            where: { id: verificationToken.id },
        });
        return {
            message: 'Email verified successfully! You can now log in.',
        };
    }
    async resendVerification(email) {
        const user = await prisma_1.prisma.user.findUnique({
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
        await prisma_1.prisma.verificationToken.deleteMany({
            where: { userId: user.id },
        });
        // Generate new token
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = hashToken(token);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + env_1.config.verificationTokenExpiresMinutes);
        await prisma_1.prisma.verificationToken.create({
            data: {
                userId: user.id,
                email: user.email,
                tokenHash,
                expiresAt,
            },
        });
        // Send email
        const verificationUrl = `${env_1.config.frontendUrl}/verify-email?token=${token}`;
        await (0, emailService_1.sendVerificationEmail)({
            to: user.email,
            name: user.name || undefined,
            verificationUrl,
        });
        return {
            message: 'Verification email sent! Please check your inbox.',
        };
    }
    async refreshAccessToken(refreshToken) {
        const storedToken = await prisma_1.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            if (storedToken) {
                await prisma_1.prisma.refreshToken.delete({
                    where: { id: storedToken.id },
                });
            }
            throw new Error('Invalid or expired refresh token');
        }
        const accessToken = (0, jwt_1.generateAccessToken)({
            userId: storedToken.user.id,
            email: storedToken.user.email,
        });
        return { accessToken };
    }
    async logout(refreshToken) {
        await prisma_1.prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
    }
    async getUserById(userId) {
        return prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                emailVerified: true,
                createdAt: true,
            },
        });
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
