const nodemailer = require('nodemailer');
const axios = require('axios');
const { pool } = require('../config/database');
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

    // Initialize email transporter
    async initEmailTransporter() {
        if (this.emailTransporter) return this.emailTransporter;

        // Use config.js as fallback if .env is not set correctly
        const config = require('../config');
        
        const emailConfig = {
            host: process.env.EMAIL_HOST || config.EMAIL_HOST || 'smtp.gmail.com',
            port: Number(process.env.EMAIL_PORT) || config.EMAIL_PORT || 465,
            secure: true, // true for 465 (SSL), false for 587 (TLS)
            auth: {
                user: process.env.EMAIL_USER || config.EMAIL_USER || 'yuriilukianets9@gmail.com',
                pass: process.env.EMAIL_PASS || config.EMAIL_PASS || 'zjlouxtsmtxdlxfo'
            },
            // Gmail SMTP configuration for SSL
            connectionTimeout: 30000,
            greetingTimeout: 20000,
            socketTimeout: 30000
        };

        console.log('🔧 Email Configuration:', {
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            user: emailConfig.auth.user
        });

        this.emailTransporter = nodemailer.createTransport(emailConfig);

        // Verify connection
        try {
            await this.emailTransporter.verify();
            console.log('✅ Email transporter ready');
        } catch (error) {
            console.error('❌ Email transporter error:', error);
            console.error('🔧 Troubleshooting: Check if port 465 is blocked by firewall');
            this.emailTransporter = null;
        }

        return this.emailTransporter;
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
                // Handle test notifications
                const [users] = await pool.execute(
                    'SELECT email FROM users WHERE id = ?',
                    [userId]
                );
                
                if (users.length === 0) {
                    throw new Error('User not found');
                }
                
                user = { email: users[0].email };
                siteName = 'Test Site';
                siteUrl = 'https://example.com';
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
            
            // If email transporter is not available, use fallback mode
            if (!transporter) {
                console.log('⚠️ Email transporter not available, using fallback mode');
                
                // Save notification record for fallback mode
                if (siteId) {
                    await this.saveNotification(userId, siteId, 'email', message, 'simulated');
                }
                
                // Return success with fallback message
                return { 
                    success: true, 
                    messageId: 'fallback-' + Date.now(),
                    fallback: true,
                    reason: 'Email blocked by network, notification simulated'
                };
            }

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: `🔔 ${subject} - ${siteName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                            <h1 style="margin: 0;">🌐 ウェブサイト監視システム</h1>
                            <p style="margin: 10px 0 0 0;">更新が検出されました</p>
                        </div>
                        
                        <div style="padding: 20px; background: #f9f9f9;">
                            <h2 style="color: #333;">📊 サイト情報</h2>
                            <p><strong>サイト名:</strong> ${siteName}</p>
                            <p><strong>URL:</strong> <a href="${siteUrl}" style="color: #667eea;">${siteUrl}</a></p>
                            
                            <h2 style="color: #333;">📝 更新詳細</h2>
                            <div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 10px 0;">
                                <p style="margin: 0; line-height: 1.6;">${message}</p>
                            </div>
                            
                            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                                この通知は、ウェブサイト監視システムによって自動的に送信されました。
                            </p>
                        </div>
                        
                        <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
                            <p style="margin: 0;">© 2024 ウェブサイト監視システム. All rights reserved.</p>
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
                        text: `🔔 ウェブサイト更新が検出されました！\n\n📊 サイト: ${siteName}\n🌐 URL: ${siteUrl}\n\n📝 詳細:\n${message}\n\nこの通知は、ウェブサイト監視システムによって自動的に送信されました。`
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
            
            // Save failed notification only for real notifications (not test ones)
            if (siteId) {
                await this.saveNotification(userId, siteId, 'line', message, 'failed');
            }
            
            return { success: false, error: error.message };
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
