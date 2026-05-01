import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import Class from './Class.js';

const Homework = sequelize.define('Homework', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

Homework.belongsTo(Class);
Class.hasMany(Homework);

export default Homework;
