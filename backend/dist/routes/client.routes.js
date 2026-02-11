"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const clientService_1 = require("../services/clientService");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Protect all routes
router.use(auth_1.authenticate);
// Get all clients
router.get('/', async (req, res) => {
    try {
        const clients = await clientService_1.clientService.listClients();
        res.json({ clients });
    }
    catch (error) {
        console.error('Error listing clients:', error);
        res.status(500).json({ error: 'Failed to list clients' });
    }
});
// Get single client
router.get('/:id', async (req, res) => {
    try {
        const client = await clientService_1.clientService.getClient(req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json({ client });
    }
    catch (error) {
        console.error('Error getting client:', error);
        res.status(500).json({ error: 'Failed to get client' });
    }
});
// Create client
router.post('/', async (req, res) => {
    try {
        const data = clientService_1.createClientSchema.parse(req.body);
        const client = await clientService_1.clientService.createClient(data);
        res.status(201).json({ client });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
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
        const data = clientService_1.updateClientSchema.parse(req.body);
        const client = await clientService_1.clientService.updateClient(req.params.id, data);
        res.json({ client });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Failed to update client' });
    }
});
// Delete client
router.delete('/:id', async (req, res) => {
    try {
        await clientService_1.clientService.deleteClient(req.params.id);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
});
exports.default = router;
