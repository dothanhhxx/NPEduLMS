import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Material = sequelize.define('Material', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('video', 'pdf', 'audio', 'book'),
        allowNull: false
    },
    level: {
        type: DataTypes.STRING,
        defaultValue: 'Beginner'
    },
    link: {
        type: DataTypes.STRING, // URL or file path
        allowNull: true
    }
});

export default Material;
