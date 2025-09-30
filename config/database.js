const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'backend_user',
    password: process.env.DB_PASSWORD || 'cupideroskama200334!`#QWE',
    database: process.env.DB_NAME || 'website_monitor',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Ensure we use utf8mb4 so multi-byte characters (emoji, CJK, etc.) can be stored
    charset: process.env.DB_CHARSET || 'utf8mb4',
    // Production SSL configuration
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    // Connection timeout settings
    connectTimeout: 60000,
};

const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        // Force connection character set to utf8mb4 to avoid collation conversion errors
        try {
            await connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            console.log('🔧 Connection charset set to utf8mb4');
        } catch (e) {
            console.warn('⚠️ Failed to set connection charset:', e.message);
        }

        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = { pool, testConnection };
