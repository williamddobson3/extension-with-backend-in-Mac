const FixedWebsiteScraper = require('./services/fixedWebsiteScraper');
const mysql = require('mysql2/promise');

// Database configuration - update this with your actual settings
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'website_monitor',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function testChangeDetection() {
    const scraper = new FixedWebsiteScraper();
    
    try {
        console.log('🚀 Starting Change Detection Test\n');

        // Test 1: Check if we have any sites to test with
        console.log('📋 Test 1: Checking for existing sites...');
        const [sites] = await pool.execute('SELECT * FROM monitored_sites LIMIT 5');
        
        if (sites.length === 0) {
            console.log('❌ No sites found in database. Please add some sites first.');
            console.log('   You can add sites through your web interface or directly in the database.');
            return;
        }

        console.log(`✅ Found ${sites.length} sites to test with`);

        // Test 2: Check existing scraping history
        console.log('\n📋 Test 2: Checking scraping history...');
        for (const site of sites) {
            const [checks] = await pool.execute(
                'SELECT COUNT(*) as count FROM site_checks WHERE site_id = ?',
                [site.id]
            );
            console.log(`   Site ${site.id} (${site.name}): ${checks[0].count} previous checks`);
        }

        // Test 3: Test change detection on each site
        console.log('\n📋 Test 3: Testing change detection...');
        for (const site of sites) {
            console.log(`\n🔍 Testing site: ${site.name} (ID: ${site.id})`);
            const changeResult = await scraper.testChangeDetection(site.id);
            
            if (changeResult.hasChanged) {
                console.log(`   🔔 CHANGES DETECTED: ${changeResult.reason}`);
                console.log(`   📊 Change Type: ${changeResult.changeType}`);
            } else {
                console.log(`   ✅ No changes detected: ${changeResult.reason}`);
            }
        }

        // Test 4: Perform a new scrape to test the full process
        console.log('\n📋 Test 4: Performing test scrape...');
        const testSite = sites[0];
        console.log(`   Testing with site: ${testSite.name}`);
        console.log(`   URL: ${testSite.url}`);
        console.log(`   Keywords: ${testSite.keywords || 'None'}`);

        const scrapeResult = await scraper.scrapeAndDetectChanges(
            testSite.id,
            testSite.url,
            testSite.keywords
        );

        if (scrapeResult.success) {
            console.log(`   ✅ Scraping successful!`);
            console.log(`   📊 Status Code: ${scrapeResult.statusCode}`);
            console.log(`   ⏱️  Response Time: ${scrapeResult.responseTime}ms`);
            console.log(`   🔑 Keywords Found: ${scrapeResult.keywordsFound ? 'Yes' : 'No'}`);
            console.log(`   🔔 Changes Detected: ${scrapeResult.hasChanged ? 'Yes' : 'No'}`);
            
            if (scrapeResult.hasChanged) {
                console.log(`   📝 Change Reason: ${scrapeResult.changeReason}`);
                console.log(`   📊 Change Type: ${scrapeResult.changeType}`);
            }
        } else {
            console.log(`   ❌ Scraping failed: ${scrapeResult.error}`);
        }

        // Test 5: Check the database after scraping
        console.log('\n📋 Test 5: Checking database after scraping...');
        const [latestChecks] = await pool.execute(`
            SELECT 
                sc.*,
                ms.name as site_name,
                ms.url
            FROM site_checks sc
            JOIN monitored_sites ms ON sc.site_id = ms.id
            WHERE sc.site_id = ?
            ORDER BY sc.created_at DESC
            LIMIT 3
        `, [testSite.id]);

        console.log(`   Latest checks for ${testSite.name}:`);
        latestChecks.forEach((check, index) => {
            console.log(`   ${index + 1}. ${check.created_at} - Status: ${check.status_code}, Changes: ${check.changes_detected ? 'Yes' : 'No'}`);
        });

        console.log('\n✅ Change detection test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await pool.end();
    }
}

// Run the test
if (require.main === module) {
    testChangeDetection()
        .then(() => {
            console.log('\n🎉 All tests completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = { testChangeDetection };
