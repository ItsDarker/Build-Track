import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin, AdminRequest } from '../middleware/adminAuth';
import { adminService } from '../services/adminService';
import { z } from 'zod';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(10),
  role: z.string().optional(), // Role name will be validated against database
  emailVerified: z.boolean().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  bio: z.string().optional(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: z.string().optional(), // Role name will be validated against database
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  bio: z.string().optional(),
  emailVerified: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(10),
});

const blockUserSchema = z.object({
  reason: z.string().optional(),
});

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * GET /api/admin/users
 * List all users with pagination
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const status = req.query.status as 'active' | 'blocked' | 'unverified';

    const result = await adminService.listUsers({ page, limit, search, role, status });
    res.json(result);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * GET /api/admin/users/all
 * Get all users for export
 */
router.get('/users/all', async (req: Request, res: Response) => {
  try {
    const users = await adminService.getAllUsers();
    res.json({ users });
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ error: 'Failed to get all users' });
  }
});

/**
 * GET /api/admin/users/:id
 * Get single user
 */
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await adminService.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/users', async (req: Request, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await adminService.createUser(data);
    res.status(201).json(user);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
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
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const user = await adminService.updateUser(req.params.id, data);
    res.json(user);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
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
router.delete('/users/:id', async (req: AdminRequest, res: Response) => {
  try {
    // Prevent self-deletion
    if (req.admin?.userId === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await adminService.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
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
router.post('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const { password } = resetPasswordSchema.parse(req.body);
    await adminService.resetPassword(req.params.id, password);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
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
router.post('/users/:id/block', async (req: AdminRequest, res: Response) => {
  try {
    // Prevent self-blocking
    if (req.admin?.userId === req.params.id) {
      return res.status(400).json({ error: 'Cannot block your own account' });
    }

    const { reason } = blockUserSchema.parse(req.body);
    const user = await adminService.blockUser(req.params.id, reason, req.admin?.userId);
    res.json(user);
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

/**
 * POST /api/admin/users/:id/unblock
 * Unblock user
 */
router.post('/users/:id/unblock', async (req: Request, res: Response) => {
  try {
    const user = await adminService.unblockUser(req.params.id);
    res.json(user);
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

/**
 * GET /api/admin/login-attempts
 * Get login attempts
 */
router.get('/login-attempts', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const email = req.query.email as string;
    const success = req.query.success === 'true' ? true : req.query.success === 'false' ? false : undefined;

    const result = await adminService.getLoginAttempts({ page, limit, email, success });
    res.json(result);
  } catch (error) {
    console.error('Error getting login attempts:', error);
    res.status(500).json({ error: 'Failed to get login attempts' });
  }
});

/**
 * GET /api/admin/notifications
 * Get admin notifications
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await adminService.getNotifications({ unreadOnly, limit });
    res.json(result);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

/**
 * PUT /api/admin/notifications/:id/read
 * Mark notification as read
 */
router.put('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    await adminService.markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * PUT /api/admin/notifications/read-all
 * Mark all notifications as read
 */
router.put('/notifications/read-all', async (req: Request, res: Response) => {
  try {
    await adminService.markAllNotificationsRead();
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

/**
 * DELETE /api/admin/notifications
 * Clear all admin notifications
 */
router.delete('/notifications', async (req: Request, res: Response) => {
  try {
    await adminService.clearAllNotifications();
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

/**
 * GET /api/admin/roles
 * Get all available roles
 */
router.get('/roles', async (req: Request, res: Response) => {
  try {
    const roles = await adminService.getRoles();
    res.json({ roles });
  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
});

export default router;
