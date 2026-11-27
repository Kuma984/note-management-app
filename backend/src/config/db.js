const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'note_app_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper function to test DB connectivity on startup
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected successfully to MySQL database:', process.env.DB_NAME || 'note_app_db');
        connection.release();
        return true;
    } catch (error) {
        console.error('Failed to connect to MySQL database:', error.message);
        return false;
    }
}

pool.testConnection = testConnection;
module.exports = pool;