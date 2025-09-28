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

async function setupTestData() {
    const pool = mysql.createPool(dbConfig);
    
    try {
        console.log('🚀 Setting up test data for change detection...\n');

        // Check if database exists and has tables
        console.log('📋 Checking database structure...');
        const [tables] = await pool.execute('SHOW TABLES');
        console.log(`✅ Found ${tables.length} tables in database`);

        // Check if we have any users
        const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
        console.log(`📊 Users in database: ${users[0].count}`);

        if (users[0].count === 0) {
            console.log('\n📝 Creating test user...');
            await pool.execute(`
                INSERT INTO users (username, email, password_hash, is_active) 
                VALUES ('testuser', 'test@example.com', 'hashed_password', TRUE)
            `);
            console.log('✅ Test user created');
        }

        // Check if we have any monitored sites
        const [sites] = await pool.execute('SELECT COUNT(*) as count FROM monitored_sites');
        console.log(`📊 Monitored sites: ${sites[0].count}`);

        if (sites[0].count === 0) {
            console.log('\n📝 Creating test sites...');
            
            // Get the first user ID
            const [userResult] = await pool.execute('SELECT id FROM users LIMIT 1');
            const userId = userResult[0].id;

            // Create test sites
            const testSites = [
                {
                    name: 'Example Site',
                    url: 'https://example.com',
                    keywords: 'example,test,demo'
                },
                {
                    name: 'HTTP Bin',
                    url: 'https://httpbin.org',
                    keywords: 'api,http,test'
                },
                {
                    name: 'JSON Placeholder',
                    url: 'https://jsonplaceholder.typicode.com',
                    keywords: 'json,api,placeholder'
                }
            ];

            for (const site of testSites) {
                await pool.execute(`
                    INSERT INTO monitored_sites (user_id, url, name, keywords, is_active) 
                    VALUES (?, ?, ?, ?, TRUE)
                `, [userId, site.url, site.name, site.keywords]);
                console.log(`   ✅ Created site: ${site.name}`);
            }
        }

        // Check if we have any site checks
        const [checks] = await pool.execute('SELECT COUNT(*) as count FROM site_checks');
        console.log(`📊 Site checks: ${checks[0].count}`);

        if (checks[0].count === 0) {
            console.log('\n📝 Creating sample site checks for testing...');
            
            // Get a site ID
            const [siteResult] = await pool.execute('SELECT id FROM monitored_sites LIMIT 1');
            const siteId = siteResult[0].id;

            // Create sample checks with different data to test change detection
            const sampleChecks = [
                {
                    content_hash: 'abc123def456',
                    content_length: 1000,
                    status_code: 200,
                    response_time_ms: 500,
                    changes_detected: false
                },
                {
                    content_hash: 'xyz789uvw012',
                    content_length: 1200,
                    status_code: 200,
                    response_time_ms: 600,
                    changes_detected: true
                },
                {
                    content_hash: 'xyz789uvw012',
                    content_length: 1200,
                    status_code: 200,
                    response_time_ms: 600,
                    changes_detected: true
                }
            ];

            for (let i = 0; i < sampleChecks.length; i++) {
                const check = sampleChecks[i];
                await pool.execute(`
                    INSERT INTO site_checks 
                    (site_id, content_hash, content_length, status_code, response_time_ms, changes_detected) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    siteId,
                    check.content_hash,
                    check.content_length,
                    check.status_code,
                    check.response_time_ms,
                    check.changes_detected
                ]);
                console.log(`   ✅ Created check ${i + 1} with hash: ${check.content_hash.substring(0, 8)}...`);
            }
        }

        // Show current data summary
        console.log('\n📊 Current Data Summary:');
        const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [siteCount] = await pool.execute('SELECT COUNT(*) as count FROM monitored_sites');
        const [checkCount] = await pool.execute('SELECT COUNT(*) as count FROM site_checks');
        
        console.log(`   👥 Users: ${userCount[0].count}`);
        console.log(`   🌐 Monitored Sites: ${siteCount[0].count}`);
        console.log(`   📊 Site Checks: ${checkCount[0].count}`);

        // Show sample sites
        const [sampleSites] = await pool.execute(`
            SELECT id, name, url, keywords 
            FROM monitored_sites 
            LIMIT 3
        `);
        
        console.log('\n📋 Sample Sites:');
        sampleSites.forEach(site => {
            console.log(`   ${site.id}. ${site.name} - ${site.url}`);
            console.log(`      Keywords: ${site.keywords || 'None'}`);
        });

        console.log('\n✅ Test data setup completed!');
        console.log('\n🚀 You can now run the change detection test:');
        console.log('   node test_change_detection.js');

    } catch (error) {
        console.error('❌ Setup failed:', error);
    } finally {
        await pool.end();
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupTestData()
        .then(() => {
            console.log('\n🎉 Setup completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupTestData };
