#!/usr/bin/env node

/**
 * Test LINE Messaging API Configuration
 * This script tests the LINE configuration and sends a test message
 */

const axios = require('axios');
const config = require('./config');

console.log('🧪 Testing LINE Messaging API Configuration...\n');

// Display configuration (without sensitive data)
console.log('📋 Configuration:');
console.log(`   Channel ID: ${config.LINE_CHANNEL_ID}`);
console.log(`   Channel Secret: ${config.LINE_CHANNEL_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log(`   Access Token: ${config.LINE_CHANNEL_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log('');

// Test LINE API connection
async function testLineAPI() {
    try {
        console.log('🔍 Testing LINE API connection...');
        
        // Test the LINE Messaging API endpoint
        const response = await axios.get('https://api.line.me/v2/bot/info', {
            headers: {
                'Authorization': `Bearer ${config.LINE_CHANNEL_ACCESS_TOKEN}`
            }
        });
        
        console.log('✅ LINE API connection successful!');
        console.log(`   Bot Name: ${response.data.displayName}`);
        console.log(`   Bot ID: ${response.data.userId}`);
        console.log(`   Status: ${response.data.status}`);
        console.log('');
        
        return true;
        
    } catch (error) {
        console.error('❌ LINE API connection failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Error: ${error.response.data.message || error.response.statusText}`);
        } else {
            console.error(`   Error: ${error.message}`);
        }
        console.log('');
        return false;
    }
}

// Test sending a message (requires a user ID)
async function testSendMessage(userId = 'test_user_id') {
    try {
        console.log('📤 Testing message sending...');
        
        const message = {
            to: userId,
            messages: [
                {
                    type: 'text',
                    text: '🧪 これはLINE通知のテストメッセージです。\n\nウェブサイト監視システムが正常に動作しています！'
                }
            ]
        };
        
        const response = await axios.post('https://api.line.me/v2/bot/message/push', message, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.LINE_CHANNEL_ACCESS_TOKEN}`
            }
        });
        
        console.log('✅ Message sending test successful!');
        console.log(`   Response: ${response.status} ${response.statusText}`);
        console.log('');
        
        return true;
        
    } catch (error) {
        console.error('❌ Message sending test failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Error: ${error.response.data.message || error.response.statusText}`);
            
            if (error.response.status === 400) {
                console.error('   💡 This is expected if the user ID is not valid or the user hasn\'t added the bot as a friend.');
            }
        } else {
            console.error(`   Error: ${error.message}`);
        }
        console.log('');
        return false;
    }
}

// Main test function
async function runTests() {
    console.log('🚀 Starting LINE configuration tests...\n');
    
    // Test 1: API Connection
    const apiTest = await testLineAPI();
    
    // Test 2: Message Sending (will likely fail with test user ID, but that's OK)
    const messageTest = await testSendMessage();
    
    // Summary
    console.log('📊 Test Summary:');
    console.log(`   API Connection: ${apiTest ? '✅ Pass' : '❌ Fail'}`);
    console.log(`   Message Sending: ${messageTest ? '✅ Pass' : '⚠️  Expected to fail with test user ID'}`);
    console.log('');
    
    if (apiTest) {
        console.log('🎉 LINE configuration is working correctly!');
        console.log('');
        console.log('📝 Next steps:');
        console.log('   1. Users need to add your LINE bot as a friend');
        console.log('   2. Users need to provide their LINE user ID');
        console.log('   3. The system will then be able to send notifications via LINE');
        console.log('');
        console.log('💡 To get a user\'s LINE ID, they can:');
        console.log('   - Add your bot as a friend');
        console.log('   - Send a message to the bot');
        console.log('   - The system will capture their user ID automatically');
    } else {
        console.log('❌ LINE configuration needs to be fixed.');
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('   1. Check if the Channel ID is correct');
        console.log('   2. Verify the Access Token is valid');
        console.log('   3. Ensure the Channel Secret is correct');
        console.log('   4. Make sure the bot is active in LINE Developers Console');
    }
}

// Run the tests
runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});
