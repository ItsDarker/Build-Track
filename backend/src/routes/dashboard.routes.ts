import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { dashboardService } from '../services/dashboardService';

const router = Router();

router.use(authenticate);

/**
 * GET /api/dashboard/stats
 * Get personalized dashboard stats
 */
router.get('/stats', async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

        const stats = await dashboardService.getDashboardStats(
            req.user.userId,
            req.user.role || 'SUBCONTRACTOR'
        );

        res.json({ stats });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ error: 'Failed to get dashboard statistics' });
    }
});

export default router;
