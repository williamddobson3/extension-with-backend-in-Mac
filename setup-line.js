#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// LINE credentials
const LINE_CREDENTIALS = {
    CHANNEL_ID: '2007999524',
    CHANNEL_SECRET: '21c0e68ea4b687bcd6f13f60485d69ce',
    ACCESS_TOKEN: 'wC2ad1cBncKnmQ+oQwAZEwkQA/mktCaAccMdFYK1HeYhpKwVohZrfGvEOeS4l1By3sSlo2dpw8EpI4GyXoQpunqB35GfV2Uc86PEXm7/tqnV4woeC29Rl/iMuzaKQHusZ9pPhY/6Xi/zOs+8fFnNjQdB04t89/1O/w1cDnyilFU='
};

async function setupLineIntegration() {
    console.log('🚀 Setting up LINE Messaging API Integration...\n');

    try {
        // 1. Check if .env file exists
        const envPath = path.join(__dirname, '.env');
        let envContent = '';

        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
            console.log('✅ Found existing .env file');
        } else {
            console.log('📝 Creating new .env file...');
        }

        // 2. Update or add LINE credentials
        const lineCredentials = [
            `# LINE Messaging API`,
            `LINE_CHANNEL_ID=${LINE_CREDENTIALS.CHANNEL_ID}`,
            `LINE_CHANNEL_ACCESS_TOKEN=${LINE_CREDENTIALS.ACCESS_TOKEN}`,
            `LINE_CHANNEL_SECRET=${LINE_CREDENTIALS.CHANNEL_SECRET}`,
            ``
        ].join('\n');

        // Remove existing LINE credentials if they exist
        const lines = envContent.split('\n');
        const filteredLines = lines.filter(line => 
            !line.startsWith('LINE_CHANNEL_') && 
            !line.startsWith('# LINE Messaging API')
        );

        // Add new LINE credentials
        const newEnvContent = [...filteredLines, lineCredentials].join('\n');

        // Write to .env file
        fs.writeFileSync(envPath, newEnvContent);
        console.log('✅ LINE credentials added to .env file');

        // 3. Test LINE API connection
        console.log('\n🔍 Testing LINE API connection...');
        
        try {
            const response = await axios.get('https://api.line.me/v2/bot/profile/U1234567890abcdef', {
                headers: {
                    'Authorization': `Bearer ${LINE_CREDENTIALS.ACCESS_TOKEN}`
                }
            });
            console.log('✅ LINE API connection successful');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                // This is expected for a non-existent user ID
                console.log('✅ LINE API connection successful (400 error expected for test user)');
            } else {
                console.log('⚠️  LINE API connection test failed:', error.message);
            }
        }

        // 4. Display setup instructions
        console.log('\n📋 LINE Integration Setup Complete!');
        console.log('\n🔧 Next Steps:');
        console.log('1. Start your server: npm start');
        console.log('2. Your LINE webhook URL will be: http://your-domain.com/api/line/webhook');
        console.log('3. Configure this URL in your LINE Developer Console');
        console.log('4. Users can now receive notifications via LINE!');
        
        console.log('\n📱 LINE Bot Features:');
        console.log('- Users can send "help" to see available commands');
        console.log('- Users can check site status with "status" command');
        console.log('- Users can test notifications with "test" command');
        console.log('- Users can enable/disable notifications with "start"/"stop"');

        console.log('\n🌐 Webhook Configuration:');
        console.log('- Go to LINE Developer Console');
        console.log('- Set Webhook URL to: http://your-domain.com/api/line/webhook');
        console.log('- Enable "Use webhook" option');
        console.log('- Verify webhook signature is working');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// Run setup
setupLineIntegration();
