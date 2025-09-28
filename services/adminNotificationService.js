const nodemailer = require('nodemailer');
require('dotenv').config();

class AdminNotificationService {
    constructor() {
        this.emailTransporter = null;
        this.adminEmail = process.env.ADMIN_EMAIL;
        this.notificationsEnabled = process.env.ADMIN_NOTIFICATIONS_ENABLED === 'true';
    }

    // Initialize email transporter
    async initEmailTransporter() {
        if (this.emailTransporter) return this.emailTransporter;

        this.emailTransporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_PORT == 465, // true for 465 (SSL), false for 587 (TLS)
            auth: {
                user: process.env.EMAIL_USER || process.env.MAIL_USER,
                pass: process.env.EMAIL_PASS || process.env.MAIL_PASS
            }
        });

        return this.emailTransporter;
    }

    // Send site added notification
    async notifySiteAdded(siteData, userEmail) {
        if (!this.notificationsEnabled || !this.adminEmail) {
            console.log('Admin notifications disabled or admin email not configured');
            return { success: false, reason: 'Admin notifications disabled' };
        }

        try {
            const transporter = await this.initEmailTransporter();
            if (!transporter) {
                throw new Error('Email transporter not available');
            }

            const mailOptions = {
                from: process.env.EMAIL_USER || process.env.MAIL_USER,
                to: this.adminEmail,
                subject: `🌐 New Site Added - ${siteData.name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center;">
                            <h1 style="margin: 0;">🌐 Website Monitor</h1>
                            <p style="margin: 10px 0 0 0;">New Site Added</p>
                        </div>
                        
                        <div style="padding: 20px; background: #f9f9f9;">
                            <h2 style="color: #333;">✅ Site Successfully Added</h2>
                            
                            <div style="background: white; padding: 15px; border-left: 4px solid #28a745; margin: 10px 0;">
                                <h3 style="color: #333; margin-top: 0;">📊 Site Details</h3>
                                <p><strong>Site Name:</strong> ${siteData.name}</p>
                                <p><strong>URL:</strong> <a href="${siteData.url}" style="color: #28a745;">${siteData.url}</a></p>
                                <p><strong>Check Interval:</strong> ${siteData.check_interval_hours} hours</p>
                                <p><strong>Keywords:</strong> ${siteData.keywords || 'None specified'}</p>
                                <p><strong>Added By:</strong> ${userEmail}</p>
                                <p><strong>Added At:</strong> ${new Date().toLocaleString('ja-JP')}</p>
                            </div>
                            
                                                         <p style="color: #666; font-size: 14px; margin-top: 20px;">
                                 This site is now being monitored for changes. You will receive alerts when updates are detected.
                             </p>
                             
                             <div style="background: #e8f5e8; padding: 15px; border-left: 4px solid #28a745; margin: 10px 0;">
                                 <h4 style="color: #333; margin-top: 0;">🔔 Notification System</h4>
                                 <p style="margin: 0; color: #333;">
                                     <strong>Automatic Monitoring:</strong> Site will be checked every ${siteData.check_interval_hours} hours<br>
                                     <strong>Change Detection:</strong> Content changes, keywords, and updates will be detected<br>
                                     <strong>User Notifications:</strong> All users monitoring this site will receive alerts via email and LINE
                                 </p>
                             </div>
                        </div>
                        
                        <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
                            <p style="margin: 0;">© 2024 Website Monitor. All rights reserved.</p>
                        </div>
                    </div>
                `
            };

            const result = await transporter.sendMail(mailOptions);
            console.log(`✅ Admin notification sent to ${this.adminEmail} for site addition`);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('❌ Admin notification failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Send site deleted notification
    async notifySiteDeleted(siteData, userEmail) {
        if (!this.notificationsEnabled || !this.adminEmail) {
            console.log('Admin notifications disabled or admin email not configured');
            return { success: false, reason: 'Admin notifications disabled' };
        }

        try {
            const transporter = await this.initEmailTransporter();
            if (!transporter) {
                throw new Error('Email transporter not available');
            }

            const mailOptions = {
                from: process.env.EMAIL_USER || process.env.MAIL_USER,
                to: this.adminEmail,
                subject: `🗑️ Site Removed - ${siteData.name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 20px; text-align: center;">
                            <h1 style="margin: 0;">🌐 Website Monitor</h1>
                            <p style="margin: 10px 0 0 0;">Site Removed</p>
                        </div>
                        
                        <div style="padding: 20px; background: #f9f9f9;">
                            <h2 style="color: #333;">🗑️ Site Successfully Removed</h2>
                            
                            <div style="background: white; padding: 15px; border-left: 4px solid #dc3545; margin: 10px 0;">
                                <h3 style="color: #333; margin-top: 0;">📊 Removed Site Details</h3>
                                <p><strong>Site Name:</strong> ${siteData.name}</p>
                                <p><strong>URL:</strong> <a href="${siteData.url}" style="color: #dc3545;">${siteData.url}</a></p>
                                <p><strong>Check Interval:</strong> ${siteData.check_interval_hours} hours</p>
                                <p><strong>Keywords:</strong> ${siteData.keywords || 'None specified'}</p>
                                <p><strong>Removed By:</strong> ${userEmail}</p>
                                <p><strong>Removed At:</strong> ${new Date().toLocaleString('ja-JP')}</p>
                            </div>
                            
                            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                                This site is no longer being monitored. All related data has been removed from the system.
                            </p>
                        </div>
                        
                        <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
                            <p style="margin: 0;">© 2024 Website Monitor. All rights reserved.</p>
                        </div>
                    </div>
                `
            };

            const result = await transporter.sendMail(mailOptions);
            console.log(`✅ Admin notification sent to ${this.adminEmail} for site deletion`);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('❌ Admin notification failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Send site updated notification
    async notifySiteUpdated(siteData, userEmail, changes) {
        if (!this.notificationsEnabled || !this.adminEmail) {
            console.log('Admin notifications disabled or admin email not configured');
            return { success: false, reason: 'Admin notifications disabled' };
        }

        try {
            const transporter = await this.initEmailTransporter();
            if (!transporter) {
                throw new Error('Email transporter not available');
            }

            const mailOptions = {
                from: process.env.EMAIL_USER || process.env.MAIL_USER,
                to: this.adminEmail,
                subject: `✏️ Site Updated - ${siteData.name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #007bff 0%, #6610f2 100%); color: white; padding: 20px; text-align: center;">
                            <h1 style="margin: 0;">🌐 Website Monitor</h1>
                            <p style="margin: 10px 0 0 0;">Site Updated</p>
                        </div>
                        
                        <div style="padding: 20px; background: #f9f9f9;">
                            <h2 style="color: #333;">✏️ Site Successfully Updated</h2>
                            
                            <div style="background: white; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
                                <h3 style="color: #333; margin-top: 0;">📊 Updated Site Details</h3>
                                <p><strong>Site Name:</strong> ${siteData.name}</p>
                                <p><strong>URL:</strong> <a href="${siteData.url}" style="color: #007bff;">${siteData.url}</a></p>
                                <p><strong>Check Interval:</strong> ${siteData.check_interval_hours} hours</p>
                                <p><strong>Keywords:</strong> ${siteData.keywords || 'None specified'}</p>
                                <p><strong>Updated By:</strong> ${userEmail}</p>
                                <p><strong>Updated At:</strong> ${new Date().toLocaleString('ja-JP')}</p>
                            </div>
                            
                            <div style="background: #e7f3ff; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
                                <h3 style="color: #333; margin-top: 0;">🔄 Changes Made</h3>
                                <ul style="color: #333;">
                                    ${changes.map(change => `<li>${change}</li>`).join('')}
                                </ul>
                            </div>
                            
                            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                                This site's monitoring configuration has been updated successfully.
                            </p>
                        </div>
                        
                        <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
                            <p style="margin: 0;">© 2024 Website Monitor. All rights reserved.</p>
                        </div>
                    </div>
                `
            };

            const result = await transporter.sendMail(mailOptions);
            console.log(`✅ Admin notification sent to ${this.adminEmail} for site update`);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('❌ Admin notification failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Test admin notification system
    async testAdminNotification() {
        if (!this.notificationsEnabled || !this.adminEmail) {
            console.log('❌ Admin notifications disabled or admin email not configured');
            return { success: false, reason: 'Admin notifications disabled' };
        }

        try {
            const transporter = await this.initEmailTransporter();
            if (!transporter) {
                throw new Error('Email transporter not available');
            }

            const mailOptions = {
                from: process.env.EMAIL_USER || process.env.MAIL_USER,
                to: this.adminEmail,
                subject: '🧪 Admin Notification Test - Website Monitor',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); color: white; padding: 20px; text-align: center;">
                            <h1 style="margin: 0;">🌐 ウェブサイトモニター</h1>
                            <p style="margin: 10px 0 0 0;">Admin Notification Test</p>
                        </div>
                        
                        <div style="padding: 20px; background: #f9f9f9;">
                            <h2 style="color: #333;">✅ Admin Notification System Test</h2>
                            
                            <div style="background: white; padding: 15px; border-left: 4px solid #6f42c1; margin: 10px 0;">
                                <p>This is a test email to verify that the admin notification system is working correctly.</p>
                                <p><strong>Admin Email:</strong> ${this.adminEmail}</p>
                                <p><strong>Test Time:</strong> ${new Date().toLocaleString('ja-JP')}</p>
                            </div>
                            
                            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                                You will now receive notifications when sites are added, updated, or removed from the monitoring system.
                            </p>
                        </div>
                        
                        <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
                            <p style="margin: 0;">© 2024 Website Monitor. All rights reserved.</p>
                        </div>
                    </div>
                `
            };

            const result = await transporter.sendMail(mailOptions);
            console.log(`✅ Admin notification test email sent to ${this.adminEmail}`);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('❌ Admin notification test failed:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new AdminNotificationService();
