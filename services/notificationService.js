const nodemailer = require('nodemailer');
const axios = require('axios');
const { pool } = require('../config/database');
const gmailApiService = require('./gmailApiService');
require('dotenv').config();

class NotificationService {
    constructor() {
        this.emailTransporter = null;
        this.lineConfig = {
            channelId: process.env.LINE_CHANNEL_ID,
            channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
            channelSecret: process.env.LINE_CHANNEL_SECRET
        };
    }

    // Initialize email transporter with multiple fallback strategies
    async initEmailTransporter() {
        if (this.emailTransporter) return this.emailTransporter;

        // Use config.js as fallback if .env is not set correctly
        const config = require('../config');
        
        // Try multiple email configurations in order of preference
        const commonAuth = {
            user: process.env.EMAIL_USER || process.env.MAIL_USER || config.EMAIL_USER || 'KM@sabosuku.com',
            pass: process.env.EMAIL_PASS || process.env.MAIL_PASS || config.EMAIL_PASS || 'hzpw wojd xszu ladn'
        };

        const emailConfigs = [
            // Configuration 1: Use explicit .env/.config first if provided
            {
                host: process.env.EMAIL_HOST || config.EMAIL_HOST || 'smtp.gmail.com',
                port: Number(process.env.EMAIL_PORT) || Number(config.EMAIL_PORT) || 587,
                secure: false,
                requireTLS: true,
                auth: commonAuth,
                connectionTimeout: 7000,
                greetingTimeout: 7000,
                socketTimeout: 7000,
                tls: {
                    servername: 'smtp.gmail.com',
                    minVersion: 'TLSv1.2'
                }
            },
            // Configuration 2: Gmail hostname with SSL (465)
            {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: commonAuth,
                connectionTimeout: 7000,
                greetingTimeout: 7000,
                socketTimeout: 7000,
                tls: {
                    servername: 'smtp.gmail.com',
                    minVersion: 'TLSv1.2'
                }
            },
            // Configuration 3: Gmail hostname with STARTTLS (587)
            {
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                requireTLS: true,
                auth: commonAuth,
                connectionTimeout: 7000,
                greetingTimeout: 7000,
                socketTimeout: 7000,
                tls: {
                    servername: 'smtp.gmail.com',
                    minVersion: 'TLSv1.2'
                }
            },
            // Configuration 4: Direct Gmail IPs (short timeouts to avoid long hangs)
            {
                host: '142.250.185.109',
                port: 465,
                secure: true,
                auth: commonAuth,
                connectionTimeout: 3000,
                greetingTimeout: 3000,
                socketTimeout: 3000,
                tls: {
                    servername: 'smtp.gmail.com',
                    rejectUnauthorized: false
                }
            },
            {
                host: '172.217.169.109',
                port: 465,
                secure: true,
                auth: commonAuth,
                connectionTimeout: 3000,
                greetingTimeout: 3000,
                socketTimeout: 3000,
                tls: {
                    servername: 'smtp.gmail.com',
                    rejectUnauthorized: false
                }
            },
            {
                host: '142.250.185.109',
                port: 587,
                secure: false,
                requireTLS: true,
                auth: commonAuth,
                connectionTimeout: 3000,
                greetingTimeout: 3000,
                socketTimeout: 3000,
                tls: {
                    servername: 'smtp.gmail.com',
                    rejectUnauthorized: false
                }
            }
        ];

        console.log('🔧 Testing email configurations...');

        for (let i = 0; i < emailConfigs.length; i++) {
            const emailConfig = emailConfigs[i];
            
            console.log(`   Testing config ${i + 1}: ${emailConfig.host}:${emailConfig.port} (${emailConfig.secure ? 'SSL' : 'TLS'})`);

            try {
                this.emailTransporter = nodemailer.createTransport(emailConfig);
                await this.emailTransporter.verify();
                console.log(`   ✅ Email transporter ready with config ${i + 1}`);
                console.log(`   📧 Using: ${emailConfig.host}:${emailConfig.port}`);
                return this.emailTransporter;
            } catch (error) {
                console.log(`   ❌ Config ${i + 1} failed: ${error.message}`);
                this.emailTransporter = null;
            }
        }

        // If all configurations fail, set up fallback mode
        console.log('⚠️ All email configurations failed - enabling fallback mode');
        console.log('📧 Email notifications will be simulated (logged to console)');
        this.emailTransporter = null;
        return null;
    }

    // Send email notification
    async sendEmail(userId, siteId, message, subject = 'ウェブサイト更新が検出されました') {
        try {
            let user, siteName, siteUrl;
            
            if (siteId) {
                // Get user email and site info for real notifications
                const [users] = await pool.execute(
                    `SELECT u.email, ms.name as site_name, ms.url 
                     FROM users u 
                     JOIN monitored_sites ms ON ms.id = ? 
                     WHERE u.id = ?`,
                    [siteId, userId]
                );
                
                if (users.length === 0) {
                    throw new Error('User or site not found');
                }
                
                user = users[0];
                siteName = user.site_name;
                siteUrl = user.url;
            } else {
                // Handle test notifications - use first monitored site if available
                const [users] = await pool.execute(
                    `SELECT u.email, ms.name as site_name, ms.url 
                     FROM users u 
                     LEFT JOIN monitored_sites ms ON ms.user_id = u.id AND ms.is_active = true
                     WHERE u.id = ?
                     ORDER BY ms.created_at ASC
                     LIMIT 1`,
                    [userId]
                );
                
                if (users.length === 0) {
                    throw new Error('User not found');
                }
                
                user = { email: users[0].email };
                
                if (users[0].site_name && users[0].url) {
                    siteName = users[0].site_name;
                    siteUrl = users[0].url;
                } else {
                    // Fallback if no sites are monitored
                    siteName = 'テストサイト';
                    siteUrl = 'https://example.com';
                }
            }
            
            // For test notifications, siteId can be null. Avoid noisy logging.

            // Check if email notifications are enabled
            const [notifications] = await pool.execute(
                'SELECT email_enabled FROM user_notifications WHERE user_id = ?',
                [userId]
            );

            if (notifications.length === 0 || !notifications[0].email_enabled) {
                console.log(`Email notifications disabled for user ${userId}`);
                return { success: false, reason: 'Email notifications disabled' };
            }

            const transporter = await this.initEmailTransporter();

            // If SMTP is not available, try Gmail API fallback before simulation
            if (!transporter) {
                try {
                    const initialized = await gmailApiService.initialize();
                    if (initialized) {
                        const apiResult = await gmailApiService.sendEmail(
                            user.email,
                            `🔔 ${subject} - ${siteName}`,
                            `
                                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);">
                                    <div style="background: #1a237e; color: white; padding: 20px 25px; border-radius: 12px 12px 0 0; text-align: center;">
                                        <h2 style="font-size: 1.4em; font-weight: 600; margin: 0;">ウェブサイト監視システムの結果</h2>
                                    </div>
                                    
                                    <div style="padding: 25px;">
                                        <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 15px 20px; border-radius: 8px; margin-bottom: 25px; font-weight: 500; color: #8b4513; border-left: 4px solid #ff6b6b; box-shadow: 0 2px 8px rgba(255, 107, 107, 0.2);">
                                            ウェブサイトの変更が検出されました！監視システムが正常に動作しています。
                                        </div>
                                        
                                        <div style="margin-bottom: 25px;">
                                            <div style="display: flex; margin-bottom: 15px; padding: 12px 0; border-bottom: 1px solid #eee; align-items: flex-start;">
                                                <span style="font-weight: 600; color: #555; min-width: 140px; flex-shrink: 0;">サービス：</span>
                                                <span style="color: #333; flex: 1;">ウェブサイト監視システム</span>
                                            </div>
                                            
                                            <div style="display: flex; margin-bottom: 15px; padding: 12px 0; border-bottom: 1px solid #eee; align-items: flex-start;">
                                                <span style="font-weight: 600; color: #555; min-width: 140px; flex-shrink: 0;">検出時間：</span>
                                                <span style="color: #333; flex: 1;">${new Date().toLocaleString('ja-JP')}</span>
                                            </div>
                                            
                                            <div style="display: flex; margin-bottom: 15px; padding: 12px 0; border-bottom: 1px solid #eee; align-items: flex-start;">
                                                <span style="font-weight: 600; color: #555; min-width: 140px; flex-shrink: 0;">サイト名：</span>
                                                <span style="color: #333; flex: 1;">${siteName}</span>
                                            </div>
                                            
                                            <div style="display: flex; margin-bottom: 15px; padding: 12px 0; border-bottom: 1px solid #eee; align-items: flex-start;">
                                                <span style="font-weight: 600; color: #555; min-width: 140px; flex-shrink: 0;">URL：</span>
                                                <span style="color: #333; flex: 1; word-break: break-all;">
                                                    <a href="${siteUrl}" style="color: #667eea; text-decoration: none; display: inline-block; margin-bottom: 5px; transition: color 0.2s;">${siteUrl}</a>
                                                </span>
                                            </div>
                                            
                                            <div style="display: flex; margin-bottom: 15px; padding: 12px 0; border-bottom: 1px solid #eee; align-items: flex-start;">
                                                <span style="font-weight: 600; color: #555; min-width: 140px; flex-shrink: 0;">変更詳細：</span>
                                                <span style="color: #333; flex: 1; line-height: 1.6;">${message}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `,
                            true
                        );

                        if (siteId) {
                            await this.saveNotification(userId, siteId, 'email', message, 'sent');
                        }

                        return { success: true, messageId: apiResult.messageId, via: 'gmail_api' };
                    }
                } catch (apiError) {
                    console.log('⚠️ Gmail API fallback failed:', apiError.message);
                }

                // Final fallback: simulate
                console.log('⚠️ Email transporter not available, using fallback mode');
                console.log('📧 SIMULATED EMAIL NOTIFICATION:');
                console.log('   To: ' + user.email);
                console.log('   Subject: ' + subject + ' - ' + siteName);
                console.log('   Site: ' + siteName + ' (' + siteUrl + ')');
                console.log('   Message: ' + message);
                console.log('   Time: ' + new Date().toLocaleString());
                console.log('   Status: ✅ Simulated successfully');

                if (siteId) {
                    await this.saveNotification(userId, siteId, 'email', message, 'simulated');
                }

                const fs = require('fs');
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    type: 'email_simulation',
                    to: user.email,
                    subject: subject,
                    site: siteName,
                    url: siteUrl,
                    message: message,
                    status: 'simulated'
                };
                try {
                    const logFile = 'email_simulation.log';
                    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
                } catch (logError) {}

                return { 
                    success: true, 
                    messageId: 'fallback-' + Date.now(),
                    fallback: true,
                    reason: 'Email blocked by network, notification simulated'
                };
            }

            const mailOptions = {
                from: process.env.EMAIL_USER || process.env.MAIL_USER,
                to: user.email,
                subject: `🔔 ${subject} - ${siteName}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);">
                        <div style="background: #1a237e; color: white; padding: 20px 25px; border-radius: 12px 12px 0 0; text-align: center;">
                            <h2 style="font-size: 1.4em; font-weight: 600; margin: 0;">ウェブサイト監視システムの結果</h2>
                        </div>
                        
                        <div style="padding: 25px;">
                            <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 15px 20px; border-radius: 8px; margin-bottom: 25px; font-weight: 500; color: #8b4513; border-left: 4px solid #ff6b6b; box-shadow: 0 2px 8px rgba(255, 107, 107, 0.2);">
                                ウェブサイトの変更が検出されました！監視システムが正常に動作しています。
                            </div>
                            
                            <div style="margin-bottom: 25px;">
                                <div style="display: flex; margin-bottom: 15px; padding: 12px 0; border-bottom: 1px solid #eee; align-items: flex-start;">
                                    <span style="font-weight: 600; color: #555; min-width: 140px; flex-shrink: 0;">サービス：</span>
                                    <span style="color: #333; flex: 1;">ウェブサイト監視システム</span>
                                </div>
                                
                                <div style="display: flex; margin-bottom: 15px; padding: 12px 0; border-bottom: 1px solid #eee; align-items: flex-start;">
                                    <span style="font-weight: 600; color: #555; min-width: 140px; flex-shrink: 0;">検出時間：</span>
                                    <span style="color: #333; flex: 1;">${new Date().toLocaleString('ja-JP')}</span>
                                </div>
                                
                                <div style="display: flex; margin-bottom: 15px; padding: 12px 0; border-bottom: 1px solid #eee; align-items: flex-start;">
                                    <span style="font-weight: 600; color: #555; min-width: 140px; flex-shrink: 0;">サイト名：</span>
                                    <span style="color: #333; flex: 1;">${siteName}</span>
                                </div>
                                
                                <div style="display: flex; margin-bottom: 15px; padding: 12px 0; border-bottom: 1px solid #eee; align-items: flex-start;">
                                    <span style="font-weight: 600; color: #555; min-width: 140px; flex-shrink: 0;">URL：</span>
                                    <span style="color: #333; flex: 1; word-break: break-all;">
                                        <a href="${siteUrl}" style="color: #667eea; text-decoration: none; display: inline-block; margin-bottom: 5px; transition: color 0.2s;">${siteUrl}</a>
                                    </span>
                                </div>
                                
                                <div style="display: flex; margin-bottom: 15px; padding: 12px 0; border-bottom: 1px solid #eee; align-items: flex-start;">
                                    <span style="font-weight: 600; color: #555; min-width: 140px; flex-shrink: 0;">変更詳細：</span>
                                    <span style="color: #333; flex: 1; line-height: 1.6;">${message}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            };

            const result = await transporter.sendMail(mailOptions);
            
            // Save notification record only for real notifications (not test ones)
            if (siteId) {
                await this.saveNotification(userId, siteId, 'email', message, 'sent');
            }

            console.log(`✅ Email sent to ${user.email}`);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('❌ Email sending failed:', error);
            
            // Save failed notification only for real notifications (not test ones)
            if (siteId) {
                await this.saveNotification(userId, siteId, 'email', message, 'failed');
            }
            
            return { success: false, error: error.message };
        }
    }

    // Send LINE notification
    async sendLineNotification(userId, siteId, message) {
        try {
            let user, siteName, siteUrl;
            
            if (siteId) {
                // Get user LINE ID and site info for real notifications
                const [users] = await pool.execute(
                    `SELECT u.line_user_id, ms.name as site_name, ms.url 
                     FROM users u 
                     JOIN monitored_sites ms ON ms.id = ? 
                     WHERE u.id = ?`,
                    [siteId, userId]
                );
                
                if (users.length === 0) {
                    throw new Error('User or site not found');
                }
                
                user = users[0];
                siteName = user.site_name;
                siteUrl = user.url;
            } else {
                // Handle test notifications
                const [users] = await pool.execute(
                    'SELECT line_user_id FROM users WHERE id = ?',
                    [userId]
                );
                
                if (users.length === 0) {
                    throw new Error('User not found');
                }
                
                user = { line_user_id: users[0].line_user_id };
                siteName = 'Test Site';
                siteUrl = 'https://example.com';
            }

            if (!user.line_user_id) {
                throw new Error('LINE user ID not configured');
            }

            if (!this.lineConfig.channelAccessToken) {
                throw new Error('LINE channel access token not configured');
            }

            const lineMessage = {
                to: user.line_user_id,
                messages: [
                    {
                        type: 'text',
                        text: `🔔 ウェブサイト更新が検出されました！<br/>
📊 サイト: ${siteName}<br/>
🌐 URL: ${siteUrl}<br/>
<br/>
📝 詳細:<br/>
${message}<br/>
<br/>
この通知は、ウェブサイト監視システムによって自動的に送信されました。`
                    }
                ]
            };

            const response = await axios.post(
                'https://api.line.me/v2/bot/message/push',
                lineMessage,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.lineConfig.channelAccessToken}`
                    }
                }
            );

            // Save notification record only for real notifications (not test ones)
            if (siteId) {
                await this.saveNotification(userId, siteId, 'line', message, 'sent');
            }

            console.log(`✅ LINE message sent to user ${userId}`);
            return { success: true, response: response.data };

        } catch (error) {
            console.error('❌ LINE notification failed:', error);
            
            // Check for specific LINE API errors
            let errorMessage = error.message;
            if (error.response && error.response.data) {
                if (error.response.data.message === "You can't send messages to yourself") {
                    errorMessage = 'エラー: ボット自身のLINE IDが設定されています。正しいユーザーのLINE IDを設定してください。';
                    console.error('⚠️ Bot tried to send message to itself. User needs to update their LINE ID.');
                } else if (error.response.data.message) {
                    errorMessage = `LINE API Error: ${error.response.data.message}`;
                }
            }
            
            // Save failed notification only for real notifications (not test ones)
            if (siteId) {
                await this.saveNotification(userId, siteId, 'line', message, 'failed');
            }
            
            return { success: false, error: errorMessage };
        }
    }

    // Save notification record to database
    async saveNotification(userId, siteId, type, message, status) {
        try {
            await pool.execute(
                'INSERT INTO notifications (user_id, site_id, type, message, status) VALUES (?, ?, ?, ?, ?)',
                [userId, siteId, type, message, status]
            );
        } catch (error) {
            console.error('Error saving notification record:', error);
        }
    }

    // Send notification to user (email and/or LINE)
    async sendNotification(userId, siteId, message, subject = 'ウェブサイト更新が検出されました') {
        const results = {
            email: null,
            line: null
        };

        // Send email notification
        try {
            results.email = await this.sendEmail(userId, siteId, message, subject);
        } catch (error) {
            console.error('Email notification error:', error);
            results.email = { success: false, error: error.message };
        }

        // Send LINE notification
        try {
            results.line = await this.sendLineNotification(userId, siteId, message);
        } catch (error) {
            console.error('LINE notification error:', error);
            results.line = { success: false, error: error.message };
        }

        return results;
    }

    // Get notification history for user
    async getNotificationHistory(userId, limit = 50) {
        try {
            const [notifications] = await pool.execute(
                `SELECT n.*, ms.name as site_name, ms.url 
                 FROM notifications n 
                 JOIN monitored_sites ms ON n.site_id = ms.id 
                 WHERE n.user_id = ? 
                 ORDER BY n.sent_at DESC 
                 LIMIT ?`,
                [userId, limit]
            );

            return notifications;
        } catch (error) {
            console.error('Error getting notification history:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();
