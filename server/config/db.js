import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Create connection
const sequelize = new Sequelize(
    process.env.DB_NAME || 'english_center',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false
    }
);

// Test connection
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');
    } catch (err) {
        console.error('Error connecting to database:', err);
    }
};

export { sequelize, connectDB };
