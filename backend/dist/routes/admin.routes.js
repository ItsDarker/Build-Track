"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const adminAuth_1 = require("../middleware/adminAuth");
const adminService_1 = require("../services/adminService");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// All admin routes require authentication and admin role
router.use(auth_1.authenticate);
router.use(adminAuth_1.requireAdmin);
// Validation schemas
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().optional(),
    password: zod_1.z.string().min(10),
    role: zod_1.z.enum(['ADMIN', 'PM', 'SUBCONTRACTOR', 'CLIENT']).optional(),
    emailVerified: zod_1.z.boolean().optional(),
    phone: zod_1.z.string().optional(),
    company: zod_1.z.string().optional(),
    jobTitle: zod_1.z.string().optional(),
    bio: zod_1.z.string().optional(),
});
const updateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    name: zod_1.z.string().optional(),
    role: zod_1.z.enum(['ADMIN', 'PM', 'SUBCONTRACTOR', 'CLIENT']).optional(),
    phone: zod_1.z.string().optional(),
    company: zod_1.z.string().optional(),
    jobTitle: zod_1.z.string().optional(),
    bio: zod_1.z.string().optional(),
    emailVerified: zod_1.z.boolean().optional(),
});
const resetPasswordSchema = zod_1.z.object({
    password: zod_1.z.string().min(10),
});
const blockUserSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await adminService_1.adminService.getStats();
        res.json(stats);
    }
    catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});
/**
 * GET /api/admin/users
 * List all users with pagination
 */
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        const role = req.query.role;
        const status = req.query.status;
        const result = await adminService_1.adminService.listUsers({ page, limit, search, role, status });
        res.json(result);
    }
    catch (error) {
        console.error('Error listing users:', error);
        res.status(500).json({ error: 'Failed to list users' });
    }
});
/**
 * GET /api/admin/users/all
 * Get all users for export
 */
router.get('/users/all', async (req, res) => {
    try {
        const users = await adminService_1.adminService.getAllUsers();
        res.json({ users });
    }
    catch (error) {
        console.error('Error getting all users:', error);
        res.status(500).json({ error: 'Failed to get all users' });
    }
});
/**
 * GET /api/admin/users/:id
 * Get single user
 */
router.get('/users/:id', async (req, res) => {
    try {
        const user = await adminService_1.adminService.getUser(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});
/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/users', async (req, res) => {
    try {
        const data = createUserSchema.parse(req.body);
        const user = await adminService_1.adminService.createUser(data);
        res.status(201).json(user);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        if (error.message === 'Email already exists') {
            return res.status(409).json({ error: error.message });
        }
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});
/**
 * PUT /api/admin/users/:id
 * Update user
 */
router.put('/users/:id', async (req, res) => {
    try {
        const data = updateUserSchema.parse(req.body);
        const user = await adminService_1.adminService.updateUser(req.params.id, data);
        res.json(user);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        if (error.message === 'Email already exists') {
            return res.status(409).json({ error: error.message });
        }
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});
/**
 * DELETE /api/admin/users/:id
 * Delete user
 */
router.delete('/users/:id', async (req, res) => {
    try {
        // Prevent self-deletion
        if (req.admin?.userId === req.params.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        await adminService_1.adminService.deleteUser(req.params.id);
        res.json({ success: true });
    }
    catch (error) {
        if (error.message === 'User not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Cannot delete the last admin user') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password (admin only)
 */
router.post('/users/:id/reset-password', async (req, res) => {
    try {
        const { password } = resetPasswordSchema.parse(req.body);
        await adminService_1.adminService.resetPassword(req.params.id, password);
        res.json({ success: true, message: 'Password reset successfully' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        if (error.message === 'User not found') {
            return res.status(404).json({ error: error.message });
        }
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});
/**
 * POST /api/admin/users/:id/block
 * Block user
 */
router.post('/users/:id/block', async (req, res) => {
    try {
        // Prevent self-blocking
        if (req.admin?.userId === req.params.id) {
            return res.status(400).json({ error: 'Cannot block your own account' });
        }
        const { reason } = blockUserSchema.parse(req.body);
        const user = await adminService_1.adminService.blockUser(req.params.id, reason, req.admin?.userId);
        res.json(user);
    }
    catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ error: 'Failed to block user' });
    }
});
/**
 * POST /api/admin/users/:id/unblock
 * Unblock user
 */
router.post('/users/:id/unblock', async (req, res) => {
    try {
        const user = await adminService_1.adminService.unblockUser(req.params.id);
        res.json(user);
    }
    catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).json({ error: 'Failed to unblock user' });
    }
});
/**
 * GET /api/admin/login-attempts
 * Get login attempts
 */
router.get('/login-attempts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const email = req.query.email;
        const success = req.query.success === 'true' ? true : req.query.success === 'false' ? false : undefined;
        const result = await adminService_1.adminService.getLoginAttempts({ page, limit, email, success });
        res.json(result);
    }
    catch (error) {
        console.error('Error getting login attempts:', error);
        res.status(500).json({ error: 'Failed to get login attempts' });
    }
});
/**
 * GET /api/admin/notifications
 * Get admin notifications
 */
router.get('/notifications', async (req, res) => {
    try {
        const unreadOnly = req.query.unreadOnly === 'true';
        const limit = parseInt(req.query.limit) || 50;
        const result = await adminService_1.adminService.getNotifications({ unreadOnly, limit });
        res.json(result);
    }
    catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});
/**
 * PUT /api/admin/notifications/:id/read
 * Mark notification as read
 */
router.put('/notifications/:id/read', async (req, res) => {
    try {
        await adminService_1.adminService.markNotificationRead(req.params.id);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});
/**
 * PUT /api/admin/notifications/read-all
 * Mark all notifications as read
 */
router.put('/notifications/read-all', async (req, res) => {
    try {
        await adminService_1.adminService.markAllNotificationsRead();
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});
/**
 * DELETE /api/admin/notifications
 * Clear all admin notifications
 */
router.delete('/notifications', async (req, res) => {
    try {
        await adminService_1.adminService.clearAllNotifications();
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});
exports.default = router;
