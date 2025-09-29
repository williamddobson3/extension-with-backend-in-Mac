const mysql = require('mysql2/promise');

async function checkSchema() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'backend_user',
        password: 'cupideroskama200334!`#QWE',
        database: 'website_monitor'
    });

    try {
        console.log('🔍 Checking Database Schema\n');

        // Check site_checks table structure
        const [columns] = await pool.execute('DESCRIBE site_checks');
        console.log('📊 site_checks table columns:');
        columns.forEach(col => {
            console.log(`   - ${col.Field} (${col.Type})`);
        });

        console.log('\n🔍 Looking for change_reason column...');
        const hasChangeReason = columns.some(col => col.Field === 'change_reason');
        console.log(`   change_reason column exists: ${hasChangeReason ? '✅ Yes' : '❌ No'}`);

        if (!hasChangeReason) {
            console.log('\n💡 This is why you\'re getting static messages!');
            console.log('   The change_reason column is missing from the database.');
            console.log('   The system detects changes but can\'t save the reason.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
