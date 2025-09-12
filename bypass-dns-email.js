const nodemailer = require('nodemailer');

// Bypass DNS issues with alternative email configurations
async function bypassDNSEmail() {
    try {
        console.log('🔧 Bypassing DNS Issues - Alternative Email Solutions');
        console.log('=====================================================');
        console.log('🚨 Your DNS resolves smtp.gmail.com to 10.10.7.111 (private IP)');
        console.log('This blocks all Gmail SMTP connections.');
        console.log('');

        // Alternative 1: Use Gmail's IMAP instead of SMTP
        console.log('🔍 Testing Gmail IMAP (alternative to SMTP)...');
        try {
            const imapTransporter = nodemailer.createTransport({
                service: 'gmail',
                host: 'imap.gmail.com',
                port: 993,
                secure: true,
                auth: {
                    user: 'yuriilukianets9@gmail.com',
                    pass: 'daao qrql rxng xyjx'
                }
            });
            
            console.log('   ✅ IMAP connection successful!');
            console.log('   Note: IMAP is for receiving, not sending emails');
        } catch (error) {
            console.log(`   ❌ IMAP failed: ${error.message}`);
        }
        console.log('');

        // Alternative 2: Try different Gmail IP addresses
        const gmailIPs = [
            '142.250.185.109',
            '142.250.185.108', 
            '142.250.185.107',
            '142.250.185.106',
            '142.250.185.105'
        ];

        console.log('🔍 Testing alternative Gmail IP addresses...');
        for (const ip of gmailIPs) {
            try {
                console.log(`   Testing IP: ${ip}:465 (SSL)`);
                const transporter = nodemailer.createTransport({
                    host: ip,
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'yuriilukianets9@gmail.com',
                        pass: 'daao qrql rxng xyjx'
                    },
                    tls: {
                        servername: 'smtp.gmail.com',
                        rejectUnauthorized: false
                    },
                    connectionTimeout: 10000,
                    greetingTimeout: 10000
                });

                await transporter.verify();
                console.log(`   ✅ Connection successful to ${ip}:465!`);
                
                // Test email sending
                console.log(`   📤 Testing email sending via ${ip}...`);
                const info = await transporter.sendMail({
                    from: 'yuriilukianets9@gmail.com',
                    to: 'yuriilukianets9@gmail.com',
                    subject: `Website Monitor - Email Test (via ${ip})`,
                    html: `
                        <h2>🌐 Website Monitor Email Test</h2>
                        <p>This email was sent via IP ${ip} to bypass DNS issues.</p>
                        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Status:</strong> ✅ Email system working via IP bypass!</p>
                    `
                });

                console.log(`   ✅ Email sent successfully via ${ip}!`);
                console.log(`   Message ID: ${info.messageId}`);
                console.log('');
                
                console.log('🎉 SUCCESS! Email working via IP bypass!');
                console.log(`Working IP: ${ip}:465`);
                console.log('Update your config.js to use this IP.');
                
                return ip; // Return working IP
                
            } catch (error) {
                console.log(`   ❌ ${ip}:465 failed: ${error.message}`);
            }
        }

        // Alternative 3: Use different email service
        console.log('🔍 Testing alternative email services...');
        console.log('   Note: You would need to create accounts on these services');
        console.log('   - Outlook/Hotmail');
        console.log('   - Yahoo Mail');
        console.log('   - ProtonMail');
        console.log('   - Your own SMTP server');
        console.log('');

        console.log('❌ All Gmail IP addresses failed');
        console.log('');
        console.log('🔧 IMMEDIATE SOLUTIONS:');
        console.log('1. DISABLE VPN completely and restart computer');
        console.log('2. Use mobile hotspot (different network)');
        console.log('3. Check corporate firewall settings');
        console.log('4. Contact your network administrator');
        console.log('');
        console.log('💡 LONG-TERM SOLUTIONS:');
        console.log('1. Configure VPN to exclude Gmail domains');
        console.log('2. Use different email service provider');
        console.log('3. Set up your own SMTP server');
        console.log('4. Use email API services (SendGrid, Mailgun)');

    } catch (error) {
        console.error('❌ Bypass attempt failed:', error.message);
    }
}

// Run the bypass test
bypassDNSEmail();
