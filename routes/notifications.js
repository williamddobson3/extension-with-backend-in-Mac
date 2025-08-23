const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

// Get notification preferences
router.get('/preferences', authenticateToken, async (req, res) => {
    try {
        const [preferences] = await pool.execute(
            'SELECT email_enabled, line_enabled, line_user_id FROM user_notifications WHERE user_id = ?',
            [req.user.id]
        );

        if (preferences.length === 0) {
            // Create default preferences if none exist
            await pool.execute(
                'INSERT INTO user_notifications (user_id, email_enabled, line_enabled) VALUES (?, true, false)',
                [req.user.id]
            );

            res.json({
                success: true,
                preferences: {
                    email_enabled: true,
                    line_enabled: false,
                    line_user_id: null
                }
            });
        } else {
            res.json({
                success: true,
                preferences: preferences[0]
            });
        }

    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update notification preferences
router.put('/preferences', authenticateToken, async (req, res) => {
    try {
        const { email_enabled, line_enabled, line_user_id } = req.body;

        // Validate input
        if (email_enabled !== undefined && typeof email_enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'email_enabled must be a boolean'
            });
        }

        if (line_enabled !== undefined && typeof line_enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'line_enabled must be a boolean'
            });
        }

        // Check if preferences exist
        const [existing] = await pool.execute(
            'SELECT id FROM user_notifications WHERE user_id = ?',
            [req.user.id]
        );

        if (existing.length === 0) {
            // Create new preferences
            await pool.execute(
                `INSERT INTO user_notifications (user_id, email_enabled, line_enabled, line_user_id) 
                 VALUES (?, ?, ?, ?)`,
                [
                    req.user.id,
                    email_enabled !== undefined ? email_enabled : true,
                    line_enabled !== undefined ? line_enabled : false,
                    line_user_id || null
                ]
            );
        } else {
            // Update existing preferences
            const updates = [];
            const values = [];

            if (email_enabled !== undefined) {
                updates.push('email_enabled = ?');
                values.push(email_enabled);
            }

            if (line_enabled !== undefined) {
                updates.push('line_enabled = ?');
                values.push(line_enabled);
            }

            if (line_user_id !== undefined) {
                updates.push('line_user_id = ?');
                values.push(line_user_id);
            }

            if (updates.length > 0) {
                values.push(req.user.id);
                await pool.execute(
                    `UPDATE user_notifications SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
                    values
                );
            }
        }

        // Update user's LINE user ID if provided
        if (line_user_id !== undefined) {
            await pool.execute(
                'UPDATE users SET line_user_id = ? WHERE id = ?',
                [line_user_id, req.user.id]
            );
        }

        res.json({
            success: true,
            message: 'Notification preferences updated successfully'
        });

    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get notification history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const { limit = 50, type } = req.query;

        let query = `
            SELECT n.*, ms.name as site_name, ms.url 
            FROM notifications n 
            JOIN monitored_sites ms ON n.site_id = ms.id 
            WHERE n.user_id = ?
        `;
        const params = [req.user.id];

        if (type) {
            query += ' AND n.type = ?';
            params.push(type);
        }

        query += ' ORDER BY n.sent_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const [notifications] = await pool.execute(query, params);

        res.json({
            success: true,
            notifications
        });

    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Test email notification
router.post('/test-email', authenticateToken, async (req, res) => {
    try {
        // Get user email
        const [users] = await pool.execute(
            'SELECT email FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const testMessage = `This is a test notification from your website monitoring service.

🌐 Service: Website Monitor
📧 Type: Test Email
🕐 Sent: ${new Date().toLocaleString('ja-JP')}

If you received this email, your email notifications are working correctly!`;

        const result = await notificationService.sendEmail(
            req.user.id,
            null, // No specific site for test
            testMessage,
            'Test Email Notification'
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Test email sent successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send test email',
                error: result.error || result.reason
            });
        }

    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Test LINE notification
router.post('/test-line', authenticateToken, async (req, res) => {
    try {
        // Check if LINE user ID is configured
        const [users] = await pool.execute(
            'SELECT line_user_id FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0 || !users[0].line_user_id) {
            return res.status(400).json({
                success: false,
                message: 'LINE user ID not configured. Please set your LINE user ID in your profile.'
            });
        }

        const testMessage = `This is a test notification from your website monitoring service.

🌐 Service: Website Monitor
📱 Type: Test LINE Message
🕐 Sent: ${new Date().toLocaleString('ja-JP')}

If you received this message, your LINE notifications are working correctly!`;

        const result = await notificationService.sendLineNotification(
            req.user.id,
            null, // No specific site for test
            testMessage
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Test LINE message sent successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send test LINE message',
                error: result.error || result.reason
            });
        }

    } catch (error) {
        console.error('Test LINE error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get notification statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const [stats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_notifications,
                SUM(CASE WHEN type = 'email' THEN 1 ELSE 0 END) as email_count,
                SUM(CASE WHEN type = 'line' THEN 1 ELSE 0 END) as line_count,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
             FROM notifications 
             WHERE user_id = ?`,
            [req.user.id]
        );

        // Get recent activity (last 7 days)
        const [recentActivity] = await pool.execute(
            `SELECT 
                DATE(sent_at) as date,
                COUNT(*) as count,
                type
             FROM notifications 
             WHERE user_id = ? AND sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY DATE(sent_at), type
             ORDER BY date DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            stats: stats[0],
            recent_activity: recentActivity
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Clear notification history
router.delete('/history', authenticateToken, async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const [result] = await pool.execute(
            `DELETE FROM notifications 
             WHERE user_id = ? AND sent_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [req.user.id, parseInt(days)]
        );

        res.json({
            success: true,
            message: `Cleared notifications older than ${days} days`,
            deleted_count: result.affectedRows
        });

    } catch (error) {
        console.error('Clear history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
