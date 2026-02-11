"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const dashboardService_1 = require("../services/dashboardService");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
/**
 * GET /api/dashboard/stats
 * Get personalized dashboard stats
 */
router.get('/stats', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Not authenticated' });
        const stats = await dashboardService_1.dashboardService.getDashboardStats(req.user.userId, req.user.role || 'SUBCONTRACTOR');
        res.json({ stats });
    }
    catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ error: 'Failed to get dashboard statistics' });
    }
});
exports.default = router;
