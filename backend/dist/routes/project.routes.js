"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const projectService_1 = require("../services/projectService");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Get all projects (ADMIN sees all, PM sees only their projects)
router.get('/', (0, rbac_1.requirePM)(), async (req, res) => {
    try {
        const status = req.query.status;
        const clientId = req.query.clientId;
        const projects = await projectService_1.projectService.listProjects({ status, clientId });
        res.json({ projects });
    }
    catch (error) {
        console.error('Error listing projects:', error);
        res.status(500).json({ error: 'Failed to list projects' });
    }
});
// Get single project (with ownership check)
router.get('/:id', rbac_1.requireProjectAccess, async (req, res) => {
    try {
        const project = await projectService_1.projectService.getProject(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ project });
    }
    catch (error) {
        console.error('Error getting project:', error);
        res.status(500).json({ error: 'Failed to get project' });
    }
});
// Create project (ADMIN and PM only)
router.post('/', (0, rbac_1.requirePM)(), async (req, res) => {
    try {
        const data = projectService_1.createProjectSchema.parse(req.body);
        const project = await projectService_1.projectService.createProject(data);
        res.status(201).json({ project });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});
// Update project
router.put('/:id', async (req, res) => {
    try {
        const data = projectService_1.updateProjectSchema.parse(req.body);
        const project = await projectService_1.projectService.updateProject(req.params.id, data);
        res.json({ project });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});
// Delete project
router.delete('/:id', async (req, res) => {
    try {
        await projectService_1.projectService.deleteProject(req.params.id);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});
exports.default = router;
