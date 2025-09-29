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

// Test email notification with actual website scraping
router.post('/test-email', authenticateToken, async (req, res) => {
    try {
        console.log(`🧪 Starting comprehensive email test for user ${req.user.id}`);
        
        // Broadcast test email to ALL users in the database
        const [allUsers] = await pool.execute('SELECT id, email FROM users');
        if (allUsers.length === 0) {
            return res.status(400).json({ success: false, message: 'No registered users found' });
        }

        const notificationService = require('../services/notificationService');
        const testMessage = `ウェブサイト監視システム - テストメッセージ\n送信日時: ${new Date().toLocaleString('ja-JP')}`;

        const results = [];
        for (const u of allUsers) {
            try {
                // Force send regardless of user preference
                const result = await notificationService.sendEmail(u.id, null, testMessage, 'Website Monitor - Test', true);
                results.push({ userId: u.id, email: u.email, result });
            } catch (err) {
                results.push({ userId: u.id, email: u.email, error: err.message });
            }

            // Small delay to avoid rate limits
            await new Promise(r => setTimeout(r, 300));
        }

        res.json({ success: true, message: `Broadcast email test sent to ${allUsers.length} users`, results });

    } catch (error) {
        console.error('Comprehensive test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during comprehensive test'
        });
    }
});

// Test LINE notification with comprehensive monitoring
router.post('/test-line', authenticateToken, async (req, res) => {
    try {
        // Broadcast LINE test to ALL users in database
        const [allUsers] = await pool.execute('SELECT id, line_user_id FROM users WHERE line_user_id IS NOT NULL');
        if (allUsers.length === 0) {
            return res.status(400).json({ success: false, message: 'No users with LINE IDs found' });
        }

        const notificationService = require('../services/notificationService');
        const testMessage = `Website Monitor - Test Message\nSent: ${new Date().toLocaleString('ja-JP')}`;

        const results = [];
        for (const u of allUsers) {
            try {
                const result = await notificationService.sendLineNotification(u.id, null, testMessage, true);
                results.push({ userId: u.id, line_user_id: u.line_user_id, result });
            } catch (err) {
                results.push({ userId: u.id, line_user_id: u.line_user_id, error: err.message });
            }

            // small delay to avoid rate limits
            await new Promise(r => setTimeout(r, 300));
        }

        res.json({ success: true, message: `Broadcast LINE test sent to ${allUsers.length} users`, results });

    } catch (error) {
        console.error('Comprehensive test LINE error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during comprehensive LINE test'
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

// Check for recent changes in monitored sites
router.post('/check-changes', authenticateToken, async (req, res) => {
    try {
        console.log(`🔍 Checking for recent changes for user ${req.user.id}`);
        
        // Get user's monitored sites. If the user has no personal sites (new user),
        // fall back to monitoring ALL active sites in the database so the user
        // can immediately receive notifications for public monitors.
        const [userSites] = await pool.execute(
            'SELECT id, name, url FROM monitored_sites WHERE user_id = ? AND is_active = true',
            [req.user.id]
        );

        let sites = userSites;
        if (!sites || sites.length === 0) {
            console.log(`User ${req.user.id} has no personal sites - falling back to all active sites`);
            const [allSites] = await pool.execute(
                'SELECT id, name, url FROM monitored_sites WHERE is_active = true'
            );
            sites = allSites;
        }

        if (!sites || sites.length === 0) {
            return res.json({
                success: true,
                changes: []
            });
        }

        // Check each site for recent changes
        let changes = [];

        for (const site of sites) {
            try {
                // Check if there are recent changes in the last 30 minutes (extended window)
                const [recentChecks] = await pool.execute(`
                    SELECT 
                        sc.changes_detected,
                        sc.created_at,
                        sc.reason
                    FROM site_checks sc
                    WHERE sc.site_id = ? 
                    AND sc.created_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
                    AND sc.changes_detected = true
                    ORDER BY sc.created_at DESC
                    LIMIT 1
                `, [site.id]);

                if (recentChecks.length > 0) {
                    const check = recentChecks[0];
                    changes.push({
                        siteName: site.name,
                        siteUrl: site.url,
                        changeType: check.reason || 'Content Modified',
                        changeDetails: check.reason || 'Page content has been updated',
                        detectedAt: check.created_at
                    });
                }
            } catch (error) {
                console.error(`Error checking site ${site.name}:`, error);
            }
        }

        console.log(`🔍 Found ${changes.length} recent changes for user ${req.user.id}`);

        res.json({
            success: true,
            changes: changes
        });

    } catch (error) {
        console.error('Check changes error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Log frontend activity to terminal
router.post('/log-frontend', authenticateToken, async (req, res) => {
    try {
        const { source, level, message, timestamp } = req.body;
        
        // Log to terminal with timestamp
        const logMessage = `[${timestamp}] ${source} ${level}: ${message}`;
        
        if (level === 'ERROR') {
            console.error(logMessage);
        } else if (level === 'SUCCESS') {
            console.log('✅', logMessage);
        } else {
            console.log('ℹ️', logMessage);
        }
        
        res.json({
            success: true,
            message: 'Logged to terminal'
        });
        
    } catch (error) {
        console.error('Log frontend error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
