"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendVerificationSchema = exports.verifyEmailSchema = exports.loginSchema = exports.signupSchema = exports.emailSchema = exports.passwordSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
// Password validation
exports.passwordSchema = zod_1.z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number');
// Email validation
exports.emailSchema = zod_1.z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim();
// Signup schema
exports.signupSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    email: exports.emailSchema,
    password: exports.passwordSchema,
});
// Login schema
exports.loginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(1, 'Password is required'),
});
// Verification token schema
exports.verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
});
// Resend verification schema
exports.resendVerificationSchema = zod_1.z.object({
    email: exports.emailSchema,
});
// Helper to validate request body
function validate(schema) {
    return (data) => {
        return schema.parse(data);
    };
}
