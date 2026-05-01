import express from 'express';
import cors from 'cors';
import { connectDB, sequelize } from './config/db.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import classRoutes from './routes/classRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import Class from './models/Class.js';
import Student from './models/Student.js';
// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/materials', materialRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Connect to DB and Start Server
const startServer = async () => {
    await connectDB();
    Class.belongsToMany(Student, { through: 'Enrollments', as: 'students', foreignKey: 'class_id' });
    Student.belongsToMany(Class, { through: 'Enrollments', as: 'classes', foreignKey: 'student_id' });
    await sequelize.sync();
    console.log('MySQL Database Synced');

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
