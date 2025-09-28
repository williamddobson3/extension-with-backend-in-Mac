const mysql = require('mysql2/promise');

// Database configuration - update this with your actual settings
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',  // Update with your MySQL password
    database: 'website_monitor',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function testDatabaseSetup() {
    const pool = mysql.createPool(dbConfig);
    
    try {
        console.log('🔍 Testing Database Setup for Website Monitoring\n');
        
        // Test 1: Check database connection
        console.log('📋 Test 1: Database Connection');
        const connection = await pool.getConnection();
        console.log('   ✅ Database connected successfully');
        connection.release();
        
        // Test 2: Check if all required tables exist
        console.log('\n📋 Test 2: Required Tables');
        const requiredTables = [
            'users', 'monitored_sites', 'site_checks', 
            'notifications', 'user_notifications'
        ];
        
        const [tables] = await pool.execute(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'website_monitor'
        `);
        
        const existingTables = tables.map(t => t.table_name);
        let allTablesExist = true;
        
        for (const table of requiredTables) {
            if (existingTables.includes(table)) {
                console.log(`   ✅ ${table} table exists`);
            } else {
                console.log(`   ❌ ${table} table missing`);
                allTablesExist = false;
            }
        }
        
        // Test 3: Check site_checks table structure (CRITICAL for change detection)
        console.log('\n📋 Test 3: site_checks Table Structure');
        const [columns] = await pool.execute('DESCRIBE site_checks');
        const columnNames = columns.map(col => col.Field);
        
        const requiredColumns = [
            'id', 'site_id', 'content_hash', 'text_content', 'content_length',
            'status_code', 'response_time_ms', 'scraping_method', 'changes_detected',
            'change_type', 'change_reason', 'keywords_found', 'keywords_list',
            'error_message', 'created_at'
        ];
        
        let allColumnsExist = true;
        for (const column of requiredColumns) {
            if (columnNames.includes(column)) {
                console.log(`   ✅ ${column} column exists`);
            } else {
                console.log(`   ❌ ${column} column missing`);
                allColumnsExist = false;
            }
        }
        
        // Test 4: Check for sample data
        console.log('\n📋 Test 4: Sample Data');
        const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [sites] = await pool.execute('SELECT COUNT(*) as count FROM monitored_sites');
        const [checks] = await pool.execute('SELECT COUNT(*) as count FROM site_checks');
        
        console.log(`   Users: ${users[0].count}`);
        console.log(`   Monitored Sites: ${sites[0].count}`);
        console.log(`   Site Checks: ${checks[0].count}`);
        
        // Test 5: Test change detection capability
        console.log('\n📋 Test 5: Change Detection Capability');
        if (allColumnsExist) {
            console.log('   ✅ All required columns exist - change detection should work');
            
            // Test if we can insert a test record
            try {
                await pool.execute(`
                    INSERT INTO site_checks 
                    (site_id, content_hash, text_content, status_code, response_time_ms, 
                     scraping_method, changes_detected, change_type, change_reason, keywords_found)
                    VALUES (1, 'test_hash', 'test content', 200, 1000, 'test', true, 'content', 'test change', false)
                `);
                console.log('   ✅ Can insert change detection records');
                
                // Clean up test record
                await pool.execute('DELETE FROM site_checks WHERE content_hash = "test_hash"');
            } catch (error) {
                console.log(`   ❌ Cannot insert change detection records: ${error.message}`);
            }
        } else {
            console.log('   ❌ Missing required columns - change detection will fail');
        }
        
        // Test 6: Check enhanced tables (optional)
        console.log('\n📋 Test 6: Enhanced Tables (Optional)');
        const enhancedTables = ['scraped_content', 'change_history'];
        for (const table of enhancedTables) {
            if (existingTables.includes(table)) {
                console.log(`   ✅ ${table} table exists (enhanced features available)`);
            } else {
                console.log(`   ⚠️  ${table} table missing (enhanced features not available)`);
            }
        }
        
        // Summary
        console.log('\n📊 SUMMARY');
        if (allTablesExist && allColumnsExist) {
            console.log('   🎉 Database is properly configured for change detection!');
            console.log('   ✅ All required tables and columns exist');
            console.log('   ✅ Change detection should work correctly');
        } else {
            console.log('   ⚠️  Database needs updates for proper change detection');
            if (!allTablesExist) {
                console.log('   ❌ Missing required tables');
            }
            if (!allColumnsExist) {
                console.log('   ❌ Missing required columns in site_checks table');
                console.log('   💡 Run FIX_EXISTING_DATABASE.sql to add missing columns');
            }
        }
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Database connection failed. Please check:');
            console.log('   1. MySQL server is running');
            console.log('   2. Database credentials are correct');
            console.log('   3. Database "website_monitor" exists');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n💡 Database "website_monitor" does not exist.');
            console.log('   Run COMPLETE_DATABASE_SETUP.sql to create it.');
        }
    } finally {
        await pool.end();
    }
}

// Run the test
if (require.main === module) {
    testDatabaseSetup()
        .then(() => {
            console.log('\n🏁 Database test completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testDatabaseSetup };
