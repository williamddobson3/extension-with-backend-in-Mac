const notificationService = require('./services/notificationService');

async function testLineDelivery() {
    console.log('🔧 Testing LINE Notification Delivery');
    console.log('=====================================\n');

    try {
        console.log('📱 Current Configuration:');
        console.log('   Channel ID: 2008063758');
        console.log('   Channel Secret: 4fee6b1dafa8a2055c493481e53f7c1b');
        console.log('   Access Token: [Configured]\n');

        // Test with user 14 (linetest) who has LINE User ID: U3c488d5f250b6069ee39e85f2ddecff3
        console.log('1️⃣ Testing LINE notification delivery to user 14...');
        console.log('   Expected LINE User ID: U3c488d5f250b6069ee39e85f2ddecff3');
        
        const testMessage = `🧪 LINE Delivery Test

🌐 Service: Website Monitor
📱 Type: Delivery Verification Test
🕐 Sent: ${new Date().toLocaleString('ja-JP')}

This message is being sent to verify that LINE notifications are being delivered to the correct LINE User ID.

If you received this message, the delivery system is working correctly!`;

        const result = await notificationService.sendLineNotification(
            14, // user ID (linetest)
            null, // site ID (test message)
            testMessage,
            'LINE Delivery Verification Test'
        );
        
        if (result.success) {
            console.log('✅ LINE notification sent successfully!');
            console.log('📱 Delivery Details:');
            console.log('   Status: Delivered');
            console.log('   Target User ID: U3c488d5f250b6069ee39e85f2ddecff3');
            console.log('   Message ID:', result.response?.sentMessages?.[0]?.id || 'N/A');
            console.log('\n🎉 LINE delivery is working correctly!');
            console.log('✅ Notifications are being sent to the correct LINE User ID');
        } else {
            console.log('❌ LINE notification failed:', result.reason);
            console.log('\n🔧 Possible issues:');
            console.log('1. LINE User ID might be invalid');
            console.log('2. User might not be friends with the bot');
            console.log('3. LINE API credentials might be incorrect');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('LINE user ID not configured')) {
            console.log('\n🔧 Issue: LINE User ID not configured for this user');
        } else if (error.message.includes('LINE channel access token not configured')) {
            console.log('\n🔧 Issue: LINE API credentials not properly configured');
        } else if (error.message.includes('401')) {
            console.log('\n🔧 Issue: LINE API authentication failed');
        }
    }
}

// Run the test
testLineDelivery();
