import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { clientService, createClientSchema, updateClientSchema } from '../services/clientService';
import { z } from 'zod';

const router = Router();

// Protect all routes
router.use(authenticate);

// Get all clients
router.get('/', async (req, res) => {
    try {
        const clients = await clientService.listClients();
        res.json({ clients });
    } catch (error) {
        console.error('Error listing clients:', error);
        res.status(500).json({ error: 'Failed to list clients' });
    }
});

// Get single client
router.get('/:id', async (req, res) => {
    try {
        const client = await clientService.getClient(req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json({ client });
    } catch (error) {
        console.error('Error getting client:', error);
        res.status(500).json({ error: 'Failed to get client' });
    }
});

// Create client
router.post('/', async (req, res) => {
    try {
        const data = createClientSchema.parse(req.body);
        const client = await clientService.createClient(data);
        res.status(201).json({ client });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const fieldErr = error.errors[0];
            const field = fieldErr.path.join('.');
            let message = fieldErr.message;

            // Provide specific validation error messages
            if (field === 'name' && fieldErr.code === 'too_small') {
                message = 'Contact name is required (must be at least 1 character)';
            } else if (field === 'email' && fieldErr.code === 'invalid_string') {
                message = 'Email must be valid (format: user@example.com)';
            } else if (field === 'phone' && message.includes('string')) {
                message = 'Phone must contain only numbers, spaces, hyphens, parentheses, or plus sign';
            }

            return res.status(400).json({
                error: message,
                field,
                details: fieldErr
            });
        }
        if (error.message === 'Client with this email already exists') {
            return res.status(409).json({ error: error.message });
        }
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
});

// Update client
router.put('/:id', async (req, res) => {
    try {
        const data = updateClientSchema.parse(req.body);
        const client = await clientService.updateClient(req.params.id, data);
        res.json({ client });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const fieldErr = error.errors[0];
            const field = fieldErr.path.join('.');
            let message = fieldErr.message;

            // Provide specific validation error messages
            if (field === 'name' && fieldErr.code === 'too_small') {
                message = 'Contact name is required (must be at least 1 character)';
            } else if (field === 'email' && fieldErr.code === 'invalid_string') {
                message = 'Email must be valid (format: user@example.com)';
            } else if (field === 'phone' && message.includes('string')) {
                message = 'Phone must contain only numbers, spaces, hyphens, parentheses, or plus sign';
            }

            return res.status(400).json({
                error: message,
                field,
                details: fieldErr
            });
        }
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Failed to update client' });
    }
});

// Delete client
router.delete('/:id', async (req, res) => {
    try {
        await clientService.deleteClient(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
});

export default router;
