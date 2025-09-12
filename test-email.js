#!/usr/bin/env node

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🧪 Testing Email Configuration');
console.log('==============================\n');

// Check environment variables
console.log('📧 Environment Variables:');
console.log(`   EMAIL_HOST: ${process.env.EMAIL_HOST || 'NOT SET'}`);
console.log(`   EMAIL_PORT: ${process.env.EMAIL_PORT || 'NOT SET'}`);
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '[SET]' : 'NOT SET'}`);
console.log('');

// Test email transporter
async function testEmailTransporter() {
    try {
        console.log('🔧 Testing email transporter...');
        
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_PORT == 465, // true for 465 (SSL), false for 587 (TLS)
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Verify connection
        await transporter.verify();
        console.log('✅ Email transporter connection successful!');
        
        // Test sending a simple email
        console.log('📤 Sending test email...');
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self for testing
            subject: '🧪 Website Monitor - Email Test',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">🌐 Website Monitor</h1>
                        <p style="margin: 10px 0 0 0;">Email Test Successful!</p>
                    </div>
                    
                    <div style="padding: 20px; background: #f9f9f9;">
                        <h2 style="color: #333;">✅ Configuration Verified</h2>
                        <p>Your email configuration is working correctly!</p>
                        <p><strong>Gmail Account:</strong> ${process.env.EMAIL_USER}</p>
                        <p><strong>SMTP Server:</strong> ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}</p>
                        
                        <p style="color: #666; font-size: 14px; margin-top: 20px;">
                            This test email confirms that your website monitoring service can send email alerts.
                        </p>
                    </div>
                    
                    <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
                        <p style="margin: 0;">© 2024 Website Monitor. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Test email sent successfully!');
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   Sent to: ${process.env.EMAIL_USER}`);
        
        console.log('\n🎉 Email configuration is working perfectly!');
        console.log('   Your website monitoring service can now send alerts to:');
        console.log(`   📧 ${process.env.EMAIL_USER}`);
        
    } catch (error) {
        console.error('❌ Email test failed:', error.message);
        
        if (error.code === 'EAUTH') {
            console.log('\n💡 Troubleshooting tips:');
            console.log('   1. Check that the Gmail App Password is correct');
            console.log('   2. Ensure 2-factor authentication is enabled on Gmail');
            console.log('   3. Verify the App Password was generated for "Mail"');
            console.log('   4. Check that the email address is correct');
        }
        
        process.exit(1);
    }
}

// Run the test
testEmailTransporter();
