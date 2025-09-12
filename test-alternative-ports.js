const nodemailer = require('nodemailer');
require('dotenv').config();

// Test different SMTP configurations to find one that works
async function testAlternativePorts() {
    try {
        console.log('🔧 Testing Alternative SMTP Ports and Configurations');
        console.log('=====================================================');
        console.log('');
        
        const configs = [
            {
                name: 'Port 465 (SSL) - Current',
                config: {
                    host: '142.250.185.109',
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'yuriilukianets9@gmail.com',
                        pass: 'daao qrql rxng xyjx'
                    },
                    tls: {
                        servername: 'smtp.gmail.com',
                        rejectUnauthorized: false
                    }
                }
            },
            {
                name: 'Port 465 (SSL) - Alternative',
                config: {
                    host: '142.250.185.109',
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'yuriilukianets9@gmail.com',
                        pass: 'daao qrql rxng xyjx'
                    },
                    tls: {
                        servername: 'smtp.gmail.com',
                        rejectUnauthorized: false
                    }
                }
            },
            {
                name: 'Port 25 (Standard SMTP)',
                config: {
                    host: '142.250.185.109',
                    port: 25,
                    secure: false,
                    auth: {
                        user: 'yuriilukianets9@gmail.com',
                        pass: 'daao qrql rxng xyjx'
                    },
                    tls: {
                        servername: 'smtp.gmail.com',
                        rejectUnauthorized: false
                    }
                }
            },
            {
                name: 'Gmail OAuth2 Service',
                config: {
                    service: 'gmail',
                    auth: {
                        user: 'yuriilukianets9@gmail.com',
                        pass: 'daao qrql rxng xyjx'
                    }
                }
            },
            {
                name: 'Direct IP with different Gmail server',
                config: {
                    host: '172.217.169.109', // Alternative Gmail IP
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'yuriilukianets9@gmail.com',
                        pass: 'daao qrql rxng xyjx'
                    },
                    tls: {
                        servername: 'smtp.gmail.com',
                        rejectUnauthorized: false
                    }
                }
            }
        ];
        
        for (const config of configs) {
            console.log(`🔍 Testing: ${config.name}`);
            console.log(`   Host: ${config.config.host || 'gmail service'}`);
            console.log(`   Port: ${config.config.port || 'default'}`);
            console.log(`   Secure: ${config.config.secure || 'false'}`);
            
            try {
                const transporter = nodemailer.createTransport(config.config);
                
                // Test connection with shorter timeout
                const connectionResult = await Promise.race([
                    transporter.verify(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Connection timeout')), 10000)
                    )
                ]);
                
                console.log('   ✅ Connection successful!');
                
                // Test sending email
                const info = await transporter.sendMail({
                    from: 'yuriilukianets9@gmail.com',
                    to: 'yuriilukianets9@gmail.com',
                    subject: `Test - ${config.name}`,
                    text: 'This is a test email to verify the configuration.'
                });
                
                console.log('   📧 Email sent successfully!');
                console.log(`   📝 Message ID: ${info.messageId}`);
                console.log('');
                console.log('🎉 Working configuration found!');
                console.log('');
                console.log('📋 Update your .env file with:');
                if (config.config.service) {
                    console.log(`   EMAIL_HOST=gmail`);
                    console.log(`   EMAIL_PORT=465`);
                } else {
                    console.log(`   EMAIL_HOST=${config.config.host}`);
                    console.log(`   EMAIL_PORT=${config.config.port}`);
                    console.log(`   EMAIL_SECURE=${config.config.secure}`);
                }
                console.log('');
                console.log('🚀 Then restart your server and try the Maker Test!');
                
                return; // Exit after finding working config
                
            } catch (error) {
                console.log(`   ❌ Failed: ${error.message}`);
                console.log('');
            }
        }
        
        console.log('❌ All configurations failed');
        console.log('');
        console.log('🔧 Final troubleshooting steps:');
        console.log('   1. Disable VPN completely');
        console.log('   2. Use mobile hotspot (different network)');
        console.log('   3. Check corporate firewall settings');
        console.log('   4. Contact network administrator');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testAlternativePorts();
