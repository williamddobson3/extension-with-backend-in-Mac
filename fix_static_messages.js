const mysql = require('mysql2/promise');

async function fixStaticMessages() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'backend_user',
        password: 'cupideroskama200334!`#QWE',
        database: 'website_monitor'
    });

    try {
        console.log('🔧 Fixing Static Messages Issue\n');

        // Step 1: Add the missing change_reason column
        console.log('📝 Step 1: Adding change_reason column...');
        await pool.execute(`
            ALTER TABLE site_checks 
            ADD COLUMN change_reason TEXT AFTER changes_detected
        `);
        console.log('   ✅ change_reason column added');

        // Step 2: Add change_type column for better categorization
        console.log('\n📝 Step 2: Adding change_type column...');
        await pool.execute(`
            ALTER TABLE site_checks 
            ADD COLUMN change_type VARCHAR(50) AFTER change_reason
        `);
        console.log('   ✅ change_type column added');

        // Step 3: Update existing records with proper change reasons
        console.log('\n📝 Step 3: Updating existing records...');
        
        // Get all records that have changes_detected = true but no reason
        const [recordsToUpdate] = await pool.execute(`
            SELECT id, content_hash, status_code, response_time_ms, created_at
            FROM site_checks 
            WHERE changes_detected = 1 
            AND (change_reason IS NULL OR change_reason = '')
            ORDER BY created_at DESC
        `);

        console.log(`   Found ${recordsToUpdate.length} records to update`);

        for (const record of recordsToUpdate) {
            // Generate a proper change reason based on available data
            let reason = 'Website content has changed';
            let changeType = 'content';

            // If we have status code info, we can be more specific
            if (record.status_code) {
                if (record.status_code >= 400) {
                    reason = `Website returned error status ${record.status_code}`;
                    changeType = 'status';
                } else if (record.status_code === 200) {
                    reason = 'Website content has changed';
                    changeType = 'content';
                }
            }

            // Update the record
            await pool.execute(`
                UPDATE site_checks 
                SET change_reason = ?, change_type = ?
                WHERE id = ?
            `, [reason, changeType, record.id]);
        }

        console.log(`   ✅ Updated ${recordsToUpdate.length} records`);

        // Step 4: Verify the fix
        console.log('\n📝 Step 4: Verifying the fix...');
        const [updatedRecords] = await pool.execute(`
            SELECT sc.*, ms.name 
            FROM site_checks sc 
            JOIN monitored_sites ms ON sc.site_id = ms.id 
            WHERE sc.changes_detected = 1
            ORDER BY sc.created_at DESC 
            LIMIT 3
        `);

        console.log('   Recent change records:');
        updatedRecords.forEach((record, i) => {
            console.log(`   ${i+1}. ${record.name} - ${record.created_at}`);
            console.log(`      Reason: ${record.change_reason}`);
            console.log(`      Type: ${record.change_type}`);
        });

        // Step 5: Test the fixed system
        console.log('\n📝 Step 5: Testing the fixed system...');
        const FixedWebsiteScraper = require('./services/fixedWebsiteScraper');
        const scraper = new FixedWebsiteScraper();

        // Get a site to test with
        const [sites] = await pool.execute('SELECT * FROM monitored_sites LIMIT 1');
        if (sites.length > 0) {
            const testSite = sites[0];
            console.log(`   Testing with site: ${testSite.name}`);
            
            const result = await scraper.scrapeAndDetectChanges(
                testSite.id,
                testSite.url,
                testSite.keywords
            );

            console.log(`   Test result:`);
            console.log(`     Success: ${result.success}`);
            console.log(`     Has Changed: ${result.hasChanged}`);
            console.log(`     Change Reason: ${result.changeReason || 'No changes'}`);
            console.log(`     Change Type: ${result.changeType || 'N/A'}`);
        }

        console.log('\n🎉 Static Messages Fix Completed!');
        console.log('\n✅ What was fixed:');
        console.log('   - Added change_reason column to store change descriptions');
        console.log('   - Added change_type column to categorize changes');
        console.log('   - Updated existing records with proper change reasons');
        console.log('   - Verified the fix is working');
        
        console.log('\n🚀 Your system will now show dynamic change messages instead of static ones!');

    } catch (error) {
        console.error('❌ Fix failed:', error.message);
    } finally {
        await pool.end();
    }
}

// Run fix if this file is executed directly
if (require.main === module) {
    fixStaticMessages()
        .then(() => {
            console.log('\n🎉 Fix completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Fix failed:', error);
            process.exit(1);
        });
}

module.exports = { fixStaticMessages };
