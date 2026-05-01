import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Class = sequelize.define('Class', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    schedule: {
        type: DataTypes.STRING, // e.g., "Mon-Wed 18:00"
        allowNull: false
    },
    level: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

export default Class;
