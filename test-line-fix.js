const notificationService = require('./services/notificationService');

async function testLineFix() {
    console.log('🔧 Testing LINE Configuration Fix');
    console.log('==================================\n');

    try {
        console.log('1️⃣ Testing LINE notification...');
        
        // Test LINE notification
        const result = await notificationService.sendLineNotification(
            1, // userId
            1, // siteId
            'Test message: LINE notifications are now working correctly!',
            'Test LINE Notification'
        );
        
        if (result.success) {
            console.log('✅ LINE notification sent successfully!');
            console.log('📱 Result:', result);
            console.log('\n🎉 LINE configuration fix successful!');
            console.log('✅ 401 Unauthorized error resolved');
            console.log('✅ LINE API authentication working');
        } else {
            console.log('❌ LINE notification failed:', result.reason);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('401')) {
            console.log('\n🔧 Still getting 401 error - checking configuration...');
            console.log('1. Make sure server is restarted after .env update');
            console.log('2. Check if LINE credentials are correct');
            console.log('3. Verify LINE bot is properly configured');
        }
    }
}

// Run the test
testLineFix();
