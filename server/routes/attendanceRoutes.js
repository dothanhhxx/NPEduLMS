import express from 'express';
import Attendance from '../models/Attendance.js';

const router = express.Router();

// GET all attendance records
router.get('/', async (req, res) => {
    try {
        const records = await Attendance.findAll();
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST mark attendance
router.post('/', async (req, res) => {
    try {
        const { studentId, date, status } = req.body;
        // Check if record exists for this student and date
        let record = await Attendance.findOne({ where: { StudentId: studentId, date: date } });

        if (record) {
            record.status = status;
            await record.save();
        } else {
            record = await Attendance.create({ StudentId: studentId, date, status });
        }
        res.json(record);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
