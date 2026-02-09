import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole, requireTaskAccess } from '../middleware/rbac';
import { taskService, createTaskSchema, updateTaskSchema } from '../services/taskService';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get tasks for a project
router.get('/', async (req, res) => {
    try {
        const projectId = req.query.projectId as string;
        if (!projectId) {
            return res.status(400).json({ error: 'Project ID required' });
        }
        const tasks = await taskService.listTasks({ projectId });
        res.json({ tasks });
    } catch (error) {
        console.error('Error listing tasks:', error);
        res.status(500).json({ error: 'Failed to list tasks' });
    }
});

// Create task (ADMIN and PM only)
router.post('/', requireRole(['ADMIN', 'PM']), async (req, res) => {
    try {
        const data = createTaskSchema.parse(req.body);
        const task = await taskService.createTask(data);
        res.status(201).json({ task });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update task (with access check)
router.put('/:id', requireTaskAccess, async (req, res) => {
    try {
        const data = updateTaskSchema.parse(req.body);
        const task = await taskService.updateTask(req.params.id, data);
        res.json({ task });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete task (with access check - ADMIN and PM only)
router.delete('/:id', requireTaskAccess, async (req, res) => {
    try {
        await taskService.deleteTask(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

export default router;
