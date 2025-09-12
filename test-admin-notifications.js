#!/usr/bin/env node

require('dotenv').config();
const adminNotificationService = require('./services/adminNotificationService');

console.log('🧪 Testing Admin Notification System');
console.log('==================================\n');

// Check environment variables
console.log('📧 Environment Variables:');
console.log(`   EMAIL_HOST: ${process.env.EMAIL_HOST || 'NOT SET'}`);
console.log(`   EMAIL_PORT: ${process.env.EMAIL_PORT || 'NOT SET'}`);
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '[SET]' : 'NOT SET'}`);
console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'NOT SET'}`);
console.log(`   ADMIN_NOTIFICATIONS_ENABLED: ${process.env.ADMIN_NOTIFICATIONS_ENABLED || 'NOT SET'}`);
console.log('');

async function testAdminNotifications() {
    try {
        console.log('🔧 Testing admin notification system...\n');

        // Test 1: Site Added Notification
        console.log('📤 Test 1: Site Added Notification');
        const siteAddedResult = await adminNotificationService.notifySiteAdded({
            id: 999,
            name: 'Test Site - Added',
            url: 'https://example.com/test-added',
            check_interval_hours: 24,
            keywords: 'test, example, added',
            is_active: true
        }, 'testuser@example.com');

        if (siteAddedResult.success) {
            console.log('✅ Site Added notification sent successfully!');
        } else {
            console.log('❌ Site Added notification failed:', siteAddedResult.reason || siteAddedResult.error);
        }

        console.log('');

        // Test 2: Site Deleted Notification
        console.log('📤 Test 2: Site Deleted Notification');
        const siteDeletedResult = await adminNotificationService.notifySiteDeleted({
            id: 999,
            name: 'Test Site - Deleted',
            url: 'https://example.com/test-deleted',
            check_interval_hours: 24,
            keywords: 'test, example, deleted',
            is_active: true
        }, 'testuser@example.com');

        if (siteDeletedResult.success) {
            console.log('✅ Site Deleted notification sent successfully!');
        } else {
            console.log('❌ Site Deleted notification failed:', siteDeletedResult.reason || siteDeletedResult.error);
        }

        console.log('');

        // Test 3: Site Updated Notification
        console.log('📤 Test 3: Site Updated Notification');
        const siteUpdatedResult = await adminNotificationService.notifySiteUpdated({
            id: 999,
            name: 'Test Site - Updated',
            url: 'https://example.com/test-updated',
            check_interval_hours: 12,
            keywords: 'test, example, updated',
            is_active: true
        }, 'testuser@example.com', [
            'Check interval changed from 24 to 12 hours',
            'Keywords updated to include "updated"',
            'Site name modified'
        ]);

        if (siteUpdatedResult.success) {
            console.log('✅ Site Updated notification sent successfully!');
        } else {
            console.log('❌ Site Updated notification failed:', siteUpdatedResult.reason || siteUpdatedResult.error);
        }

        console.log('');

        // Test 4: Admin Notification Test
        console.log('📤 Test 4: Admin Notification System Test');
        const testResult = await adminNotificationService.testAdminNotification();

        if (testResult.success) {
            console.log('✅ Admin notification system test successful!');
        } else {
            console.log('❌ Admin notification system test failed:', testResult.reason || testResult.error);
        }

        console.log('\n🎉 Admin notification system testing completed!');
        console.log('\n📧 Summary:');
        console.log(`   Admin Email: ${process.env.ADMIN_EMAIL}`);
        console.log(`   Notifications Enabled: ${process.env.ADMIN_NOTIFICATIONS_ENABLED}`);
        console.log('   You will now receive emails when sites are added, updated, or deleted');

    } catch (error) {
        console.error('❌ Admin notification testing failed:', error.message);
        process.exit(1);
    }
}

// Run the tests
testAdminNotifications();
