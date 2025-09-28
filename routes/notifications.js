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
        
        // Get user email and monitored sites
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

        // Get all active sites monitored by this user
        const [sites] = await pool.execute(
            'SELECT id, name, url, keywords FROM monitored_sites WHERE user_id = ? AND is_active = true',
            [req.user.id]
        );

        if (sites.length === 0) {
            return res.status(400).json({
                success: false,
                message: '監視サイトが見つかりません。まず監視するサイトを追加してください。'
            });
        }

        console.log(`🔍 Found ${sites.length} sites to test for user ${req.user.id}`);

        // Import required services
        const websiteMonitor = require('../services/websiteMonitor');
        const bulkNotificationService = require('../services/bulkNotificationService');

        let testResults = [];
        let changesDetected = 0;

        // Test each monitored site
        for (const site of sites) {
            try {
                console.log(`🌐 Testing site: ${site.name} (${site.url})`);
                
                // 1. Scrape the website and check for changes
                const scrapeResult = await websiteMonitor.checkWebsite(
                    site.id, 
                    site.url, 
                    site.keywords
                );

                if (scrapeResult.success) {
                    console.log(`✅ Site ${site.name} scraped successfully`);
                    
                    // 2. Check if changes were detected
                    const changeResult = await websiteMonitor.detectChanges(site.id);
                    
                    if (changeResult.hasChanged) {
                        changesDetected++;
                        console.log(`🔄 ${site.name}で変更が検出されました: ${changeResult.reason}`);
                        
                        // 3. Send real notifications about the changes
                        const notificationResult = await bulkNotificationService.notifySiteChange(site.id, changeResult);
                        
                        testResults.push({
                            site: site.name,
                            url: site.url,
                            status: 'success',
                            changesDetected: true,
                            changeReason: changeResult.reason,
                            notificationsSent: notificationResult.success,
                            notificationDetails: notificationResult
                        });
                        
                    } else {
                        console.log(`✅ ${site.name}で変更は検出されませんでした`);
                        testResults.push({
                            site: site.name,
                            url: site.url,
                            status: 'success',
                            changesDetected: false,
                            changeReason: '変更は検出されませんでした',
                            notificationsSent: false
                        });
                    }
                    
                } else {
                    console.log(`❌ Failed to scrape ${site.name}: ${scrapeResult.error}`);
                    testResults.push({
                        site: site.name,
                        url: site.url,
                        status: 'failed',
                        error: scrapeResult.error,
                        changesDetected: false,
                        notificationsSent: false
                    });
                }

                // Add small delay between sites to avoid overwhelming servers
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                console.error(`Error testing site ${site.name}:`, error);
                testResults.push({
                    site: site.name,
                    url: site.url,
                    status: 'error',
                    error: error.message,
                    changesDetected: false,
                    notificationsSent: false
                });
            }
        }

        // Create simple test summary
        const testMessage = `ウェブサイト監視テスト結果<br/>
テスト完了: ${new Date().toLocaleString('ja-JP')}<br/>
テスト対象サイト数: ${sites.length}<br/>
変更検出数: ${changesDetected}<br/>
通知送信数: ${testResults.filter(r => r.notificationsSent).length}<br/>
<br/>
${changesDetected > 0 ? '変更が検出され、通知が送信されました。' : '変更は検出されませんでした。'}`;

        // Try to send the test results via email (but don't fail if email doesn't work)
        let emailResult = null;
        try {
            emailResult = await notificationService.sendEmail(
                req.user.id,
                null, // No specific site for test
                testMessage,
                'ウェブサイト監視システム - テスト結果'
            );
            
            // Check if it's using fallback mode
            if (emailResult.fallback) {
                console.log('📧 Email using fallback mode due to network restrictions');
            }
        } catch (emailError) {
            console.log('📧 Email test failed (expected due to network restrictions):', emailError.message);
            emailResult = { success: false, reason: 'Email blocked by network restrictions' };
        }

        // Prepare detailed change information for frontend
        const changes = testResults
            .filter(r => r.changesDetected)
            .map(result => ({
                siteName: result.site,
                siteUrl: result.url,
                changeType: result.changeReason || 'Content Modified',
                changeDetails: result.changeReason || 'Page content has been updated',
                notificationStatus: result.notificationsSent ? 'Sent' : 'Failed'
            }));

        // Always return results to frontend, regardless of email success
        res.json({
            success: true,
            message: `テスト完了！${changesDetected}件の変更が検出されました。`,
            testResults: {
                totalSites: sites.length,
                changesDetected,
                notificationsSent: testResults.filter(r => r.notificationsSent).length,
                results: testResults,
                changes: changes, // Add detailed change information
                emailStatus: emailResult ? emailResult.success : false,
                emailMessage: emailResult ? emailResult.reason : 'Email not attempted'
            }
        });

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
        console.log(`🧪 Starting comprehensive LINE test for user ${req.user.id}`);
        
        // Check if LINE user ID is configured
        const [users] = await pool.execute(
            'SELECT line_user_id FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0 || !users[0].line_user_id) {
            return res.status(400).json({
                success: false,
                message: 'LINEユーザーIDが設定されていません。プロフィールからLINEユーザーIDを設定してください。'
            });
        }

        // Get all active sites monitored by this user
        const [sites] = await pool.execute(
            'SELECT id, name, url, keywords FROM monitored_sites WHERE user_id = ? AND is_active = true',
            [req.user.id]
        );

        if (sites.length === 0) {
            return res.status(400).json({
                success: false,
                message: '監視サイトが見つかりません。まず監視するサイトを追加してください。'
            });
        }

        console.log(`🔍 Found ${sites.length} sites to test for user ${req.user.id}`);

        // Import required services
        const websiteMonitor = require('../services/websiteMonitor');
        const bulkNotificationService = require('../services/bulkNotificationService');

        let testResults = [];
        let changesDetected = 0;

        // Test each monitored site
        for (const site of sites) {
            console.log(`🌐 Testing site: ${site.name} (${site.url})`);
            
            try {
                // First check the website
                const checkResult = await websiteMonitor.checkWebsite(site.id, site.url, site.keywords);
                
                if (!checkResult.success) {
                    throw new Error(checkResult.error || 'Failed to check website');
                }
                
                // Then check for changes
                const changeResult = await websiteMonitor.checkForChangesAndNotify(site.id);
                
                testResults.push({
                    site: site.name,
                    url: site.url,
                    changesDetected: changeResult.hasChanged,
                    changeReason: changeResult.reason,
                    notificationsSent: changeResult.notificationsSent || false
                });

                if (changeResult.hasChanged) {
                    changesDetected++;
                    console.log(`   🚨 変更が検出されました: ${changeResult.reason}`);
                    if (changeResult.notificationsSent) {
                        notificationsSent++;
                    }
                } else {
                    console.log(`   ✅ 変更は検出されませんでした`);
                }
            } catch (error) {
                console.error(`   ❌ Error checking site ${site.name}:`, error.message);
                testResults.push({
                    site: site.name,
                    url: site.url,
                    changesDetected: false,
                    changeReason: `Error: ${error.message}`,
                    notificationsSent: false
                });
            }
        }

        // Count notifications sent (already handled by checkForChangesAndNotify)
        let notificationsSent = testResults.filter(r => r.notificationsSent).length;

        // Create test summary message in Japanese
        const testMessage = `📊 テスト概要:
• テストしたサイト数: ${sites.length}
• 成功したスクレイピング: ${testResults.length}
• 検出された変更: ${changesDetected}
• 送信された通知: ${notificationsSent}

🔍 詳細結果:

${testResults.map(result => 
    `🚀 ${result.site}
   URL: ${result.url}
   ステータス: ${result.changesDetected ? '🔄 変更検出' : '✅ 変更なし'}`
).join('\n\n')}`;

        // Send comprehensive test results via LINE
        let lineResult = null;
        try {
            lineResult = await notificationService.sendLineNotification(
                req.user.id,
                null, // No specific site for test
                testMessage,
                'Website Monitor - Comprehensive System Test Results'
            );
            
            console.log('📱 LINE test message sent successfully');
        } catch (lineError) {
            console.log('📱 LINE test failed:', lineError.message);
            lineResult = { success: false, reason: lineError.message || 'Unknown error' };
        }

        // Prepare detailed change information for frontend
        const changes = testResults
            .filter(r => r.changesDetected)
            .map(result => ({
                siteName: result.site,
                siteUrl: result.url,
                changeType: result.changeReason || 'Content Modified',
                changeDetails: result.changeReason || 'Page content has been updated',
                notificationStatus: result.notificationsSent ? 'Sent' : 'Failed'
            }));

        // Check if LINE failed due to bot sending to itself
        let responseMessage = `Comprehensive LINE test completed! ${changesDetected} changes detected.`;
        if (lineResult && !lineResult.success) {
            if (lineResult.error && lineResult.error.includes('ボット自身のLINE ID')) {
                responseMessage = 'テストは完了しましたが、LINE送信に失敗しました。';
            }
        }

        // Always return results to frontend, regardless of LINE success
        res.json({
            success: lineResult && lineResult.success,
            message: responseMessage,
            error: lineResult && !lineResult.success ? lineResult.error : undefined,
            testResults: {
                totalSites: sites.length,
                changesDetected,
                notificationsSent: testResults.filter(r => r.notificationsSent).length,
                results: testResults,
                changes: changes, // Add detailed change information
                lineStatus: lineResult ? lineResult.success : false,
                lineMessage: lineResult ? (lineResult.error || lineResult.reason) : 'LINE not attempted'
            }
        });

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
        
        // Get user's monitored sites
        const [sites] = await pool.execute(
            'SELECT id, name, url FROM monitored_sites WHERE user_id = ? AND is_active = true',
            [req.user.id]
        );

        if (sites.length === 0) {
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
