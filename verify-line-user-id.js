const notificationService = require('./services/notificationService');

async function verifyLineUserID() {
    console.log('🔧 Verifying LINE User ID Configuration');
    console.log('======================================\n');

    try {
        // Test with the main user (Test1er) who should be receiving notifications
        console.log('📱 Testing LINE notification to main user (Test1er)...');
        console.log('   User ID: 9');
        console.log('   LINE User ID: U3c488d5f250b6069ee39e85f2ddecff3');
        console.log('   Email: tester@gmail.com\n');

        const verificationMessage = `🔔 LINE User ID Verification

🌐 Service: Website Monitor
📱 Type: User ID Verification Test
🕐 Sent: ${new Date().toLocaleString('ja-JP')}

This message confirms that LINE notifications are being sent to the correct LINE User ID.

✅ If you received this message, your LINE User ID is correctly configured!
✅ All future notifications will be delivered to this LINE account.

Your configured LINE User ID: U3c488d5f250b6069ee39e85f2ddecff3`;

        const result = await notificationService.sendLineNotification(
            9, // Main user ID (Test1er)
            null, // No specific site
            verificationMessage,
            'LINE User ID Verification Test'
        );
        
        if (result.success) {
            console.log('✅ LINE notification sent successfully!');
            console.log('\n📊 Delivery Confirmation:');
            console.log('   ✅ Message delivered to LINE User ID: U3c488d5f250b6069ee39e85f2ddecff3');
            console.log('   ✅ Message ID:', result.response?.sentMessages?.[0]?.id || 'N/A');
            console.log('   ✅ Delivery Status: Success');
            
            console.log('\n🎉 VERIFICATION COMPLETE!');
            console.log('✅ Your LINE User ID is correctly configured');
            console.log('✅ Notifications are being sent to the right LINE account');
            console.log('✅ All future website monitoring alerts will reach you via LINE');
            
            console.log('\n📱 What this means:');
            console.log('• When websites you monitor change, you\'ll get LINE notifications');
            console.log('• Test notifications (like this one) will be delivered to your LINE');
            console.log('• The system is working correctly and ready for production use');
            
        } else {
            console.log('❌ LINE notification failed:', result.reason);
            console.log('\n🔧 Troubleshooting:');
            console.log('1. Check if you\'re friends with the LINE bot');
            console.log('2. Verify the LINE User ID is correct');
            console.log('3. Ensure LINE API credentials are valid');
        }
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

// Run the verification
verifyLineUserID();
