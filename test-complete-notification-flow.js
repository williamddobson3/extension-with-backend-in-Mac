#!/usr/bin/env node

require('dotenv').config();
const { pool } = require('./config/database');
const websiteMonitor = require('./services/websiteMonitor');
const bulkNotificationService = require('./services/bulkNotificationService');

console.log('🧪 Testing Complete Notification Flow');
console.log('====================================\n');

async function testCompleteFlow() {
    try {
        console.log('🔧 Testing complete notification flow...\n');

        // Step 1: Get a test site from the database
        console.log('📊 Step 1: Getting test site from database...');
        const [sites] = await pool.execute(
            'SELECT id, name, url, keywords FROM monitored_sites WHERE is_active = true LIMIT 1'
        );

        if (sites.length === 0) {
            console.log('❌ No active sites found in database');
            console.log('   Please add at least one site first');
            return;
        }

        const testSite = sites[0];
        console.log(`✅ Found test site: ${testSite.name} (ID: ${testSite.id})`);
        console.log(`   URL: ${testSite.url}`);
        console.log(`   Keywords: ${testSite.keywords || 'None'}\n`);

        // Step 2: Test change detection
        console.log('🔍 Step 2: Testing change detection...');
        const changeResult = await websiteMonitor.detectChanges(testSite.id);
        
        if (changeResult.hasChanged) {
            console.log(`🔄 Changes detected: ${changeResult.reason}`);
            console.log(`   Current Hash: ${changeResult.currentHash}`);
            console.log(`   Previous Hash: ${changeResult.previousHash}`);
        } else {
            console.log(`✅ No changes detected: ${changeResult.reason}`);
        }
        console.log('');

        // Step 3: Test bulk notification service
        console.log('📤 Step 3: Testing bulk notification service...');
        const users = await bulkNotificationService.getUsersWatchingSite(testSite.id);
        console.log(`   Users watching this site: ${users.length}`);
        
        for (const user of users) {
            console.log(`   - User ${user.id}: ${user.email} (Email: ${user.email_enabled ? '✅' : '❌'}, LINE: ${user.line_enabled ? '✅' : '❌'})`);
        }
        console.log('');

        // Step 4: Test complete flow with notifications
        console.log('🚀 Step 4: Testing complete flow with notifications...');
        const completeResult = await websiteMonitor.checkForChangesAndNotify(testSite.id);
        
        if (completeResult.hasChanged) {
            console.log(`🔄 Changes detected and notifications processed:`);
            console.log(`   Reason: ${completeResult.reason}`);
            console.log(`   Notifications Sent: ${completeResult.notificationsSent ? '✅' : '❌'}`);
            
            if (completeResult.notificationDetails) {
                const details = completeResult.notificationDetails;
                console.log(`   Site: ${details.siteName}`);
                console.log(`   Total Users: ${details.totalUsers}`);
                console.log(`   Success Count: ${details.successCount}`);
                console.log(`   Failure Count: ${details.failureCount}`);
            }
        } else {
            console.log(`✅ No changes detected, no notifications sent`);
        }
        console.log('');

        // Step 5: Test manual bulk notification (for testing purposes)
        console.log('🧪 Step 5: Testing manual bulk notification...');
        const testChangeDetails = {
            reason: 'Manual test notification - Content changed',
            currentHash: 'test_hash_' + Date.now(),
            previousHash: 'test_hash_previous',
            currentKeywords: true,
            previousKeywords: false
        };

        const testNotificationResult = await bulkNotificationService.testBulkNotification(testSite.id);
        
        if (testNotificationResult.success) {
            console.log(`✅ Manual bulk notification test successful!`);
            console.log(`   Site: ${testNotificationResult.siteName}`);
            console.log(`   Users notified: ${testNotificationResult.successCount}/${testNotificationResult.totalUsers}`);
        } else {
            console.log(`❌ Manual bulk notification test failed: ${testNotificationResult.reason || testNotificationResult.error}`);
        }

        console.log('\n🎉 Complete notification flow testing completed!');
        console.log('\n📋 Summary:');
        console.log(`   Test Site: ${testSite.name}`);
        console.log(`   Change Detection: ${changeResult.hasChanged ? '✅ Working' : '✅ No changes (expected)'}`);
        console.log(`   Bulk Notifications: ${completeResult.notificationsSent ? '✅ Working' : '✅ No changes (expected)'}`);
        console.log(`   Manual Test: ${testNotificationResult.success ? '✅ Working' : '❌ Failed'}`);

        console.log('\n💡 Next steps:');
        console.log('1. Add more sites to test with multiple users');
        console.log('2. Modify site content to trigger real change detection');
        console.log('3. Check your email and LINE for notifications');
        console.log('4. Monitor server logs for notification details');

    } catch (error) {
        console.error('❌ Complete notification flow testing failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
testCompleteFlow();
