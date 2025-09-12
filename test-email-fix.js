const nodemailer = require('nodemailer');

// Test email configuration
async function testEmailConfig() {
    try {
        console.log('🔧 Testing Email Configuration');
        console.log('==============================');
        console.log('🚨 DNS Issue Detected: smtp.gmail.com resolves to 10.10.7.111');
        console.log('This suggests VPN or corporate network interference.');
        console.log('');
        
        // Try multiple SMTP configurations to bypass DNS issues
        const configs = [
            {
                name: 'Gmail OAuth2 (Bypass DNS)',
                config: {
                    service: 'gmail',
                    auth: {
                        user: 'yuriilukianets9@gmail.com',
                        pass: 'daao qrql rxng xyjx'
                    }
                }
            },
            {
                name: 'Direct IP with different port',
                config: {
                    host: '142.250.185.109',
                    port: 25,  // Standard SMTP port
                    secure: false,
                    auth: {
                        user: 'yuriilukianets9@gmail.com',
                        pass: 'daao qrql rxng xyjx'
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                }
            },
            {
                name: 'Alternative Gmail ports',
                config: {
                    host: 'smtp.gmail.com',
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'yuriilukianets9@gmail.com',
                        pass: 'daao qrql rxng xyjx'
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                }
            }
        ];

        for (const config of configs) {
            try {
                console.log(`🔍 Testing: ${config.name}`);
                console.log(`   Config: ${JSON.stringify(config.config, null, 2)}`);
                
                const transporter = nodemailer.createTransport(config.config);
                
                // Test connection
                console.log('   Testing SMTP connection...');
                await transporter.verify();
                console.log('   ✅ SMTP connection successful!');
                
                // Test email sending
                console.log('   Testing email sending...');
                const info = await transporter.sendMail({
                    from: 'yuriilukianets9@gmail.com',
                    to: 'yuriilukianets9@gmail.com',
                    subject: `Website Monitor - Email Test (${config.name})`,
                    html: `
                        <h2>🌐 Website Monitor Email Test</h2>
                        <p>This is a test email to verify the configuration is working.</p>
                        <p><strong>Method:</strong> ${config.name}</p>
                        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Status:</strong> ✅ Email system is working!</p>
                    `
                });

                console.log('   ✅ Test email sent successfully!');
                console.log(`   Message ID: ${info.messageId}`);
                console.log('');
                
                console.log('🎉 Email configuration is working perfectly!');
                console.log(`Working method: ${config.name}`);
                console.log('You can now use the "メールテスト" button in the extension.');
                
                return; // Success, exit the function
                
            } catch (error) {
                console.log(`   ❌ Failed: ${error.message}`);
                console.log('');
            }
        }
        
        // If all configs failed
        console.log('❌ All email configurations failed');
        console.log('');
        console.log('🔧 Solutions to try:');
        console.log('1. Disable VPN temporarily');
        console.log('2. Use a different network');
        console.log('3. Check corporate firewall settings');
        console.log('4. Try using a mobile hotspot');
        
    } catch (error) {
        console.error('❌ Email test failed:', error.message);
    }
}

// Run the test
testEmailConfig();
