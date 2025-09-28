const mysql = require('mysql2/promise');

async function quickDebug() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'website_monitor'
    });

    try {
        console.log('🔍 Quick Debug - Checking for Static Messages\n');

        // Check recent checks
        const [checks] = await pool.execute(`
            SELECT sc.*, ms.name 
            FROM site_checks sc 
            JOIN monitored_sites ms ON sc.site_id = ms.id 
            ORDER BY sc.created_at DESC 
            LIMIT 5
        `);

        console.log(`📊 Recent checks: ${checks.length}`);
        checks.forEach((check, i) => {
            console.log(`${i+1}. ${check.name}`);
            console.log(`   Time: ${check.created_at}`);
            console.log(`   Changes: ${check.changes_detected ? 'Yes' : 'No'}`);
            console.log(`   Reason: ${check.change_reason || 'None'}`);
            console.log(`   Hash: ${check.content_hash ? check.content_hash.substring(0, 16) + '...' : 'null'}`);
            console.log('');
        });

        // Check for static message patterns
        const [reasons] = await pool.execute(`
            SELECT DISTINCT change_reason 
            FROM site_checks 
            WHERE change_reason IS NOT NULL 
            AND change_reason != ''
        `);

        console.log(`📝 Unique change reasons: ${reasons.length}`);
        reasons.forEach((reason, i) => {
            console.log(`${i+1}. "${reason.change_reason}"`);
        });

        // Check sites
        const [sites] = await pool.execute('SELECT * FROM monitored_sites');
        console.log(`\n🌐 Monitored sites: ${sites.length}`);
        sites.forEach((site, i) => {
            console.log(`${i+1}. ${site.name} - ${site.url}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

quickDebug();
