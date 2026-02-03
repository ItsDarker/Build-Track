import { z } from 'zod';

// Password validation
export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

// Signup schema
export const signupSchema = z.object({
  name: z.string().optional(),
  email: emailSchema,
  password: passwordSchema,
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Verification token schema
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// Resend verification schema
export const resendVerificationSchema = z.object({
  email: emailSchema,
});

// Helper to validate request body
export function validate<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    return schema.parse(data);
  };
}
