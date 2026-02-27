import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireProjectAccess } from '../middleware/rbac';
import { projectService, createProjectSchema, updateProjectSchema } from '../services/projectService';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all projects (ADMIN sees all, PM sees only their projects)
router.get('/', requirePermission('read', 'project'), async (req: any, res) => {
    try {
        const status = req.query.status as string;
        const clientId = req.query.clientId as string;
        const projects = await projectService.listProjects({ status, clientId });
        res.json({ projects });
    } catch (error) {
        console.error('Error listing projects:', error);
        res.status(500).json({ error: 'Failed to list projects' });
    }
});

// Get single project (with ownership check)
router.get('/:id', requireProjectAccess, async (req, res) => {
    try {
        const project = await projectService.getProject(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ project });
    } catch (error) {
        console.error('Error getting project:', error);
        res.status(500).json({ error: 'Failed to get project' });
    }
});

// Create project (ADMIN and PM only)
router.post('/', requirePermission('create', 'project'), async (req, res) => {
    try {
        const data = createProjectSchema.parse(req.body);
        const project = await projectService.createProject(data);
        res.status(201).json({ project });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const fieldErrors = error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code,
            }));
            return res.status(400).json({
                error: fieldErrors[0]?.message || 'Validation failed',
                fieldErrors,
            });
        }
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Update project
router.put('/:id', requireProjectAccess, async (req, res) => {
    try {
        const data = updateProjectSchema.parse(req.body);
        const project = await projectService.updateProject(req.params.id, data);
        res.json({ project });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const fieldErrors = error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code,
            }));
            return res.status(400).json({
                error: fieldErrors[0]?.message || 'Validation failed',
                fieldErrors,
            });
        }
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete project
router.delete('/:id', async (req, res) => {
    try {
        await projectService.deleteProject(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Assign project to a user
router.post('/:id/assign', requireProjectAccess, async (req, res) => {
    try {
        const { assignedToId } = req.body;
        if (!assignedToId) {
            return res.status(400).json({ error: 'assignedToId is required' });
        }
        const project = await projectService.assignProject(req.params.id, assignedToId);
        res.json({ project });
    } catch (error) {
        console.error('Error assigning project:', error);
        res.status(500).json({ error: 'Failed to assign project' });
    }
});

// Start project - sets status to IN_PROGRESS and creates first task
router.post('/:id/start', requireProjectAccess, async (req, res) => {
    try {
        const { taskTitle, assigneeId } = req.body;
        if (!assigneeId) {
            return res.status(400).json({ error: 'assigneeId is required' });
        }
        const task = await projectService.startProject(
            req.params.id,
            taskTitle || 'CRM / Lead',
            assigneeId
        );
        res.json({ task });
    } catch (error) {
        console.error('Error starting project:', error);
        res.status(500).json({ error: 'Failed to start project' });
    }
});

// Cancel project - requires a reason
router.post('/:id/cancel', requireProjectAccess, async (req, res) => {
    try {
        const { cancellationReason } = req.body;
        if (!cancellationReason) {
            return res.status(400).json({ error: 'cancellationReason is required' });
        }
        const project = await projectService.cancelProject(req.params.id, cancellationReason);
        res.json({ project });
    } catch (error) {
        console.error('Error cancelling project:', error);
        res.status(500).json({ error: 'Failed to cancel project' });
    }
});

// Close project - optional completion note
router.post('/:id/close', requireProjectAccess, async (req, res) => {
    try {
        const { completionNote } = req.body;
        const project = await projectService.closeProject(req.params.id, completionNote);
        res.json({ project });
    } catch (error) {
        console.error('Error closing project:', error);
        res.status(500).json({ error: 'Failed to close project' });
    }
});

// Restore a cancelled project back to PLANNING
router.post('/:id/restore', requireProjectAccess, async (req, res) => {
    try {
        const project = await projectService.restoreProject(req.params.id);
        res.json({ project });
    } catch (error) {
        console.error('Error restoring project:', error);
        res.status(500).json({ error: 'Failed to restore project' });
    }
});

export default router;
