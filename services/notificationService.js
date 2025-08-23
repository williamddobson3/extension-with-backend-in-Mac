const nodemailer = require('nodemailer');
const axios = require('axios');
const { pool } = require('../config/database');
require('dotenv').config();

class NotificationService {
    constructor() {
        this.emailTransporter = null;
        this.lineConfig = {
            channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
            channelSecret: process.env.LINE_CHANNEL_SECRET
        };
    }

    // Initialize email transporter
    async initEmailTransporter() {
        if (this.emailTransporter) return this.emailTransporter;

        this.emailTransporter = nodemailer.createTransporter({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Verify connection
        try {
            await this.emailTransporter.verify();
            console.log('✅ Email transporter ready');
        } catch (error) {
            console.error('❌ Email transporter error:', error);
            this.emailTransporter = null;
        }

        return this.emailTransporter;
    }

    // Send email notification
    async sendEmail(userId, siteId, message, subject = 'Website Update Detected') {
        try {
            // Get user email and site info
            const [users] = await pool.execute(
                `SELECT u.email, ms.name as site_name, ms.url 
                 FROM users u 
                 JOIN monitored_sites ms ON ms.id = ? 
                 WHERE u.id = ?`,
                [siteId, userId]
            );
            console.log(users);

            if (users.length === 0) {
                throw new Error('User or site not found');
            }

            const user = users[0];

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
            if (!transporter) {
                throw new Error('Email transporter not available');
            }

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: `🔔 ${subject} - ${user.site_name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                            <h1 style="margin: 0;">🌐 Website Monitor</h1>
                            <p style="margin: 10px 0 0 0;">Update Detected</p>
                        </div>
                        
                        <div style="padding: 20px; background: #f9f9f9;">
                            <h2 style="color: #333;">📊 Site Information</h2>
                            <p><strong>Site Name:</strong> ${user.site_name}</p>
                            <p><strong>URL:</strong> <a href="${user.url}" style="color: #667eea;">${user.url}</a></p>
                            
                            <h2 style="color: #333;">📝 Update Details</h2>
                            <div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 10px 0;">
                                <p style="margin: 0; line-height: 1.6;">${message}</p>
                            </div>
                            
                            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                                This notification was sent automatically by your website monitoring service.
                            </p>
                        </div>
                        
                        <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
                            <p style="margin: 0;">© 2024 Website Monitor. All rights reserved.</p>
                        </div>
                    </div>
                `
            };

            const result = await transporter.sendMail(mailOptions);
            
            // Save notification record
            await this.saveNotification(userId, siteId, 'email', message, 'sent');

            console.log(`✅ Email sent to ${user.email}`);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('❌ Email sending failed:', error);
            
            // Save failed notification
            await this.saveNotification(userId, siteId, 'email', message, 'failed');
            
            return { success: false, error: error.message };
        }
    }

    // Send LINE notification
    async sendLineNotification(userId, siteId, message) {
        try {
            // Get user LINE ID and site info
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

            const user = users[0];

            if (!user.line_user_id) {
                return { success: false, reason: 'No LINE user ID configured' };
            }

            // Check if LINE notifications are enabled
            const [notifications] = await pool.execute(
                'SELECT line_enabled FROM user_notifications WHERE user_id = ?',
                [userId]
            );

            if (notifications.length === 0 || !notifications[0].line_enabled) {
                console.log(`LINE notifications disabled for user ${userId}`);
                return { success: false, reason: 'LINE notifications disabled' };
            }

            if (!this.lineConfig.channelAccessToken) {
                throw new Error('LINE channel access token not configured');
            }

            const lineMessage = {
                to: user.line_user_id,
                messages: [
                    {
                        type: 'text',
                        text: `🔔 Website Update Detected!\n\n📊 Site: ${user.site_name}\n🌐 URL: ${user.url}\n\n📝 Details:\n${message}\n\nThis notification was sent automatically by your website monitoring service.`
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

            // Save notification record
            await this.saveNotification(userId, siteId, 'line', message, 'sent');

            console.log(`✅ LINE message sent to user ${userId}`);
            return { success: true, response: response.data };

        } catch (error) {
            console.error('❌ LINE notification failed:', error);
            
            // Save failed notification
            await this.saveNotification(userId, siteId, 'line', message, 'failed');
            
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
    async sendNotification(userId, siteId, message, subject = 'Website Update Detected') {
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
