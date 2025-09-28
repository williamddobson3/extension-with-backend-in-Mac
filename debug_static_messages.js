const mysql = require('mysql2/promise');
const FixedWebsiteScraper = require('./services/fixedWebsiteScraper');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'website_monitor',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function debugStaticMessages() {
    const pool = mysql.createPool(dbConfig);
    const scraper = new FixedWebsiteScraper();
    
    try {
        console.log('🔍 Debugging Static Messages Issue\n');

        // Check 1: Database status
        console.log('📋 Check 1: Database Status');
        const [sites] = await pool.execute('SELECT * FROM monitored_sites LIMIT 3');
        const [checks] = await pool.execute('SELECT COUNT(*) as count FROM site_checks');
        
        console.log(`   Sites: ${sites.length}`);
        console.log(`   Total checks: ${checks[0].count}`);
        
        if (sites.length === 0) {
            console.log('❌ No sites found - this could cause static messages');
            return;
        }

        // Check 2: Recent scraping activity
        console.log('\n📋 Check 2: Recent Scraping Activity');
        const [recentChecks] = await pool.execute(`
            SELECT 
                sc.*,
                ms.name as site_name,
                ms.url
            FROM site_checks sc
            JOIN monitored_sites ms ON sc.site_id = ms.id
            ORDER BY sc.created_at DESC
            LIMIT 5
        `);

        console.log(`   Recent checks: ${recentChecks.length}`);
        recentChecks.forEach((check, index) => {
            console.log(`   ${index + 1}. ${check.site_name} - ${check.created_at} - Changes: ${check.changes_detected ? 'Yes' : 'No'}`);
        });

        // Check 3: Test change detection
        console.log('\n📋 Check 3: Testing Change Detection');
        const testSite = sites[0];
        console.log(`   Testing site: ${testSite.name} (ID: ${testSite.id})`);
        
        const changeResult = await scraper.detectChanges(testSite.id);
        console.log(`   Change detection result:`);
        console.log(`     Has Changed: ${changeResult.hasChanged}`);
        console.log(`     Reason: ${changeResult.reason}`);
        if (changeResult.changeType) {
            console.log(`     Change Type: ${changeResult.changeType}`);
        }

        // Check 4: Perform a real scrape
        console.log('\n📋 Check 4: Performing Real Scrape');
        console.log(`   URL: ${testSite.url}`);
        console.log(`   Keywords: ${testSite.keywords || 'None'}`);
        
        const scrapeResult = await scraper.scrapeAndDetectChanges(
            testSite.id,
            testSite.url,
            testSite.keywords
        );

        console.log(`   Scrape result:`);
        console.log(`     Success: ${scrapeResult.success}`);
        console.log(`     Status Code: ${scrapeResult.statusCode}`);
        console.log(`     Response Time: ${scrapeResult.responseTime}ms`);
        console.log(`     Has Changed: ${scrapeResult.hasChanged}`);
        console.log(`     Change Reason: ${scrapeResult.changeReason || 'N/A'}`);

        // Check 5: Look for static message patterns
        console.log('\n📋 Check 5: Checking for Static Message Patterns');
        
        // Check if there are any hardcoded messages in the database
        const [staticMessages] = await pool.execute(`
            SELECT DISTINCT change_reason 
            FROM site_checks 
            WHERE change_reason IS NOT NULL 
            AND change_reason != ''
        `);

        console.log(`   Unique change reasons in database: ${staticMessages.length}`);
        staticMessages.forEach((msg, index) => {
            console.log(`   ${index + 1}. "${msg.change_reason}"`);
        });

        // Check 6: Test multiple scrapes to see if we get dynamic results
        console.log('\n📋 Check 6: Testing Multiple Scrapes for Dynamic Results');
        
        for (let i = 1; i <= 3; i++) {
            console.log(`\n   Scrape ${i}:`);
            const result = await scraper.scrapeAndDetectChanges(
                testSite.id,
                testSite.url,
                testSite.keywords
            );
            
            console.log(`     Content Hash: ${result.contentHash ? result.contentHash.substring(0, 16) + '...' : 'null'}`);
            console.log(`     Has Changed: ${result.hasChanged}`);
            console.log(`     Change Reason: ${result.changeReason || 'No changes'}`);
            
            // Wait 2 seconds between scrapes
            if (i < 3) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Summary
        console.log('\n📊 Summary:');
        console.log('===========');
        
        if (recentChecks.length === 0) {
            console.log('❌ No recent checks found - system may not be scraping');
        } else if (recentChecks.every(check => !check.changes_detected)) {
            console.log('⚠️  No changes detected in recent checks - this could cause static messages');
            console.log('   Try monitoring a site that changes frequently');
        } else {
            console.log('✅ System appears to be working - changes are being detected');
        }

        console.log('\n💡 If you\'re seeing static messages:');
        console.log('   1. Make sure the site you\'re monitoring actually changes');
        console.log('   2. Check if the scraping is working (status code 200)');
        console.log('   3. Verify the change detection logic is running');
        console.log('   4. Look at the browser console for any JavaScript errors');

    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        await pool.end();
    }
}

// Run debug if this file is executed directly
if (require.main === module) {
    debugStaticMessages()
        .then(() => {
            console.log('\n🎉 Debug completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Debug failed:', error);
            process.exit(1);
        });
}

module.exports = { debugStaticMessages };
