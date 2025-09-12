const notificationService = require('./services/notificationService');

async function testLineNewCredentials() {
    console.log('🔧 Testing LINE with New Credentials');
    console.log('====================================\n');

    try {
        console.log('📱 LINE Configuration:');
        console.log('   Channel ID: 2008063758');
        console.log('   Channel Secret: 4fee6b1dafa8a2055c493481e53f7c1b');
        console.log('   Access Token: [Configured]\n');

        console.log('1️⃣ Testing LINE API authentication...');
        
        // Test with a user that has a LINE user ID
        const result = await notificationService.sendLineNotification(
            9, // userId (tester@gmail.com)
            1, // siteId
            'Test message: LINE notifications are working with new credentials!',
            'Test LINE Notification'
        );
        
        if (result.success) {
            console.log('✅ LINE notification sent successfully!');
            console.log('📱 Result:', result);
            console.log('\n🎉 LINE configuration fix successful!');
            console.log('✅ New credentials working correctly');
            console.log('✅ LINE API authentication successful');
        } else {
            console.log('❌ LINE notification failed:', result.reason);
            
            if (result.reason && result.reason.includes('401')) {
                console.log('\n🔧 Still getting 401 error:');
                console.log('1. Check if credentials are correct');
                console.log('2. Verify LINE bot is properly configured');
                console.log('3. Make sure server is restarted');
            } else if (result.reason && result.reason.includes('LINE user ID')) {
                console.log('\n🔧 LINE User ID issue:');
                console.log('1. User needs a valid LINE User ID');
                console.log('2. Check database for user LINE ID');
                console.log('3. Update user with real LINE User ID');
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('401')) {
            console.log('\n🔧 Authentication Error:');
            console.log('1. Check LINE credentials in .env file');
            console.log('2. Verify LINE bot configuration');
            console.log('3. Restart server after credential update');
        } else if (error.message.includes('LINE user ID')) {
            console.log('\n🔧 User Configuration Error:');
            console.log('1. User needs LINE User ID in database');
            console.log('2. Run setup-line-user.js first');
            console.log('3. Update with real LINE User ID');
        }
    }
}

// Run the test
testLineNewCredentials();
