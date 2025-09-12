const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function createTestAccount() {
    try {
        // Check if test account already exists
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE username = ?',
            ['linetest']
        );

        if (existing.length > 0) {
            console.log('Test account already exists');
            await pool.end();
            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash('test123', 12);

        // Create test account
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
            ['linetest', 'linetest@example.com', passwordHash]
        );

        console.log('✅ Test account created:');
        console.log('   Username: linetest');
        console.log('   Password: test123');
        console.log('   User ID:', result.insertId);

        // Set up LINE user ID
        await pool.execute(
            'UPDATE users SET line_user_id = ? WHERE id = ?',
            [`U3c488d5f250b6069ee39e85f2ddecff3`, result.insertId]
        );

        // Create notification preferences
        await pool.execute(
            'INSERT INTO user_notifications (user_id, email_enabled, line_enabled) VALUES (?, TRUE, TRUE)',
            [result.insertId]
        );

        console.log('✅ LINE user ID and preferences set up');

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
    }
}

createTestAccount();
