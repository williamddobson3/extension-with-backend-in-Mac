const nodemailer = require('nodemailer');
require('dotenv').config();

// Test the fixed email configuration
async function testFixedEmailConfig() {
    try {
        console.log('🔧 Testing Fixed Email Configuration');
        console.log('====================================');
        console.log('');
        
        // Show current configuration
        console.log('📧 Current Configuration:');
        console.log(`   Host: ${process.env.EMAIL_HOST || 'Not set'}`);
        console.log(`   Port: ${process.env.EMAIL_PORT || 'Not set'}`);
        console.log(`   User: ${process.env.EMAIL_USER || 'Not set'}`);
        console.log(`   Pass: ${process.env.EMAIL_PASS ? 'Set' : 'Not set'}`);
        console.log('');
        
        // Create transporter with fixed config
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || '142.250.185.109',
            port: Number(process.env.EMAIL_PORT) || 465,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER || 'yuriilukianets9@gmail.com',
                pass: process.env.EMAIL_PASS || 'daao qrql rxng xyjx'
            },
            tls: {
                servername: 'smtp.gmail.com',
                rejectUnauthorized: false
            },
            connectionTimeout: 30000,
            greetingTimeout: 20000,
            socketTimeout: 30000
        });
        
        console.log('🔍 Testing connection...');
        
        // Verify connection
        await transporter.verify();
        console.log('✅ Connection successful!');
        
        // Test sending a simple email
        console.log('📧 Testing email send...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER || 'yuriilukianets9@gmail.com',
            to: process.env.EMAIL_USER || 'yuriilukianets9@gmail.com',
            subject: 'Test Email - Configuration Fixed',
            text: 'This is a test email to verify the configuration is working.'
        });
        
        console.log('✅ Test email sent successfully!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log('');
        console.log('🎉 Email configuration is now working!');
        console.log('');
        console.log('🚀 You can now:');
        console.log('   1. Restart your server: npm start');
        console.log('   2. Try the "Maker Test" button');
        console.log('   3. Send real notifications');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('   1. Make sure .env file is updated');
        console.log('   2. Check if port 465 is blocked by firewall');
        console.log('   3. Verify Gmail app password is correct');
        console.log('   4. Try disabling VPN temporarily');
    }
}

// Run the test
testFixedEmailConfig();
