import express from 'express';
import Material from '../models/Material.js';

const router = express.Router();

// GET all materials
router.get('/', async (req, res) => {
    try {
        const materials = await Material.findAll();
        res.json(materials);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new material
router.post('/', async (req, res) => {
    try {
        const material = await Material.create(req.body);
        res.status(201).json(material);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
