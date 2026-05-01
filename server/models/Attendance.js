import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import Student from './Student.js';

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('present', 'absent', 'late'),
        defaultValue: 'absent'
    }
});

// Relationships
Attendance.belongsTo(Student);
Student.hasMany(Attendance);

export default Attendance;
