"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const taskService_1 = require("../services/taskService");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Get tasks for a project
router.get('/', async (req, res) => {
    try {
        const projectId = req.query.projectId;
        if (!projectId) {
            return res.status(400).json({ error: 'Project ID required' });
        }
        const tasks = await taskService_1.taskService.listTasks({ projectId });
        res.json({ tasks });
    }
    catch (error) {
        console.error('Error listing tasks:', error);
        res.status(500).json({ error: 'Failed to list tasks' });
    }
});
// Create task (ADMIN and PM only)
router.post('/', (0, rbac_1.requireRole)(['ADMIN', 'PM']), async (req, res) => {
    try {
        const data = taskService_1.createTaskSchema.parse(req.body);
        const task = await taskService_1.taskService.createTask(data);
        res.status(201).json({ task });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});
// Update task (with access check)
router.put('/:id', rbac_1.requireTaskAccess, async (req, res) => {
    try {
        const data = taskService_1.updateTaskSchema.parse(req.body);
        const task = await taskService_1.taskService.updateTask(req.params.id, data);
        res.json({ task });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});
// Delete task (with access check - ADMIN and PM only)
router.delete('/:id', rbac_1.requireTaskAccess, async (req, res) => {
    try {
        await taskService_1.taskService.deleteTask(req.params.id);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});
exports.default = router;
