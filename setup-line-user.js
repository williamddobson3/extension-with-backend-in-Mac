const { pool } = require('./config/database');

async function setupLineUser() {
    console.log('🔧 Setting up LINE User ID in Database');
    console.log('======================================\n');

    try {
        // Check if users table has line_user_id column
        console.log('1️⃣ Checking database schema...');
        const [columns] = await pool.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'line_user_id'
        `);

        if (columns.length === 0) {
            console.log('   Adding line_user_id column to users table...');
            await pool.execute(`
                ALTER TABLE users 
                ADD COLUMN line_user_id VARCHAR(255) NULL
            `);
            console.log('   ✅ line_user_id column added');
        } else {
            console.log('   ✅ line_user_id column already exists');
        }

        // Check if user_notifications table exists
        console.log('\n2️⃣ Checking user_notifications table...');
        const [tables] = await pool.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'user_notifications'
        `);

        if (tables.length === 0) {
            console.log('   Creating user_notifications table...');
            await pool.execute(`
                CREATE TABLE user_notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    email_enabled BOOLEAN DEFAULT TRUE,
                    line_enabled BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            console.log('   ✅ user_notifications table created');
        } else {
            console.log('   ✅ user_notifications table already exists');
        }

        // Get existing users
        console.log('\n3️⃣ Checking existing users...');
        const [users] = await pool.execute('SELECT id, email FROM users');
        
        if (users.length === 0) {
            console.log('   No users found. Creating a test user...');
            await pool.execute(`
                INSERT INTO users (email, password, created_at) 
                VALUES ('test@example.com', 'test123', NOW())
            `);
            console.log('   ✅ Test user created');
        }

        // Update users with LINE user ID (using a placeholder for now)
        console.log('\n4️⃣ Setting up LINE user IDs...');
        const [updatedUsers] = await pool.execute('SELECT id, email FROM users');
        
        for (const user of updatedUsers) {
            // Check if user already has a line_user_id
            const [existing] = await pool.execute(
                'SELECT line_user_id FROM users WHERE id = ?',
                [user.id]
            );
            
            if (!existing[0].line_user_id) {
                // Set a placeholder LINE user ID (user needs to replace this with their actual LINE user ID)
                const placeholderLineId = `U${user.id.toString().padStart(32, '0')}placeholder`;
                await pool.execute(
                    'UPDATE users SET line_user_id = ? WHERE id = ?',
                    [placeholderLineId, user.id]
                );
                console.log(`   ✅ User ${user.email} (ID: ${user.id}) - LINE ID set to placeholder`);
            } else {
                console.log(`   ✅ User ${user.email} (ID: ${user.id}) - LINE ID already set`);
            }

            // Ensure user has notification preferences
            const [notifications] = await pool.execute(
                'SELECT id FROM user_notifications WHERE user_id = ?',
                [user.id]
            );
            
            if (notifications.length === 0) {
                await pool.execute(`
                    INSERT INTO user_notifications (user_id, email_enabled, line_enabled) 
                    VALUES (?, TRUE, TRUE)
                `, [user.id]);
                console.log(`   ✅ Notification preferences created for user ${user.id}`);
            }
        }

        console.log('\n🎉 LINE User Setup Complete!');
        console.log('\n📱 Next Steps:');
        console.log('1. Get your actual LINE User ID from LINE app');
        console.log('2. Update the placeholder LINE User ID in database');
        console.log('3. Test LINE notifications');
        
        console.log('\n💡 To get your LINE User ID:');
        console.log('1. Add your LINE bot as a friend');
        console.log('2. Send a message to the bot');
        console.log('3. Check the webhook logs for your User ID');
        console.log('4. Update the database with your real User ID');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    } finally {
        await pool.end();
    }
}

// Run the setup
setupLineUser();
