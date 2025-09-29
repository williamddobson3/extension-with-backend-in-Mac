const mysql = require('mysql2/promise');
require('dotenv').config();

async function runAdminMigration() {
    let connection;
    
    try {
        console.log('🔄 Starting admin migration...');
        
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'backend_user',
            password: process.env.DB_PASSWORD || 'cupideroskama200334!`#QWE',
            database: process.env.DB_NAME || 'website_monitor'
        });

        console.log('✅ Connected to database');

        // Add is_admin column if it doesn't exist
        console.log('🔄 Adding is_admin column...');
        await connection.execute(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
        `);
        console.log('✅ is_admin column added');

        // Set KM@sabosuku.com as admin
        console.log('🔄 Setting KM@sabosuku.com as admin...');
        const [result] = await connection.execute(`
            UPDATE users SET is_admin = TRUE WHERE email = 'KM@sabosuku.com'
        `);
        console.log(`✅ Updated ${result.affectedRows} user(s) to admin status`);

        // Create index for better performance
        console.log('🔄 Creating index...');
        await connection.execute(`
            CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin)
        `);
        console.log('✅ Index created');

        // Verify the migration
        console.log('🔄 Verifying migration...');
        const [users] = await connection.execute(`
            SELECT id, username, email, is_admin FROM users WHERE is_admin = TRUE
        `);
        
        console.log('✅ Admin users found:');
        users.forEach(user => {
            console.log(`   - ${user.username} (${user.email}) - Admin: ${user.is_admin}`);
        });

        console.log('🎉 Admin migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the migration
runAdminMigration();
