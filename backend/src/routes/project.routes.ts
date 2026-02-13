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
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Update project
router.put('/:id', async (req, res) => {
    try {
        const data = updateProjectSchema.parse(req.body);
        const project = await projectService.updateProject(req.params.id, data);
        res.json({ project });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
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

export default router;
