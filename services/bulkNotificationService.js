const { pool } = require('../config/database');
const notificationService = require('./notificationService');

class BulkNotificationService {
    constructor() {
        this.notificationService = notificationService;
    }

    // Get all users watching a specific site
    async getAllActiveUsers() {
        try {
            const [users] = await pool.execute(
                `SELECT DISTINCT u.id, u.email, u.line_user_id, un.email_enabled, un.line_enabled
                 FROM users u
                 LEFT JOIN user_notifications un ON u.id = un.user_id
                 WHERE u.is_active = TRUE`,
                []
            );

            // Set default preferences if none exist
            return users.map(user => ({
                ...user,
                email_enabled: user.email_enabled !== null ? user.email_enabled : true,
                line_enabled: user.line_enabled !== null ? user.line_enabled : false
            }));
        } catch (error) {
            console.error('Error getting all active users:', error);
            throw error;
        }
    }

    async getUsersWatchingSite(siteId) {
        try {
            const [users] = await pool.execute(
                `SELECT DISTINCT u.id, u.email, u.line_user_id, un.email_enabled, un.line_enabled
                 FROM users u
                 JOIN monitored_sites ms ON u.id = ms.user_id
                 LEFT JOIN user_notifications un ON u.id = un.user_id
                 WHERE ms.id = ? AND u.is_active = TRUE`,
                [siteId]
            );

            // Set default preferences if none exist
            return users.map(user => ({
                ...user,
                email_enabled: user.email_enabled !== null ? user.email_enabled : true,
                line_enabled: user.line_enabled !== null ? user.line_enabled : false
            }));
        } catch (error) {
            console.error('Error getting users watching site:', error);
            throw error;
        }
    }

    // Notify all users watching a site when content changes
    async notifySiteChange(siteId, changeDetails) {
        try {
            console.log(`🔔 Notifying users about site change for site ID: ${siteId}`);

            // Get site information
            const [sites] = await pool.execute(
                'SELECT id, name, url FROM monitored_sites WHERE id = ?',
                [siteId]
            );

            if (sites.length === 0) {
                console.log(`Site ${siteId} not found`);
                return { success: false, reason: 'Site not found' };
            }

            const site = sites[0];

            // Get all active users in the database
            const users = await this.getAllActiveUsers();
            console.log(`Found ${users.length} active users in database`);

            if (users.length === 0) {
                console.log(`No active users found in database`);
                return { success: false, reason: 'No active users found' };
            }

            // Prepare notification message
            const notificationMessage = this.createChangeNotificationMessage(site, changeDetails);

            // Send notifications to each user
            const results = [];
            for (const user of users) {
                try {
                    const result = await this.notifyUser(user, siteId, notificationMessage, changeDetails);
                    results.push({
                        userId: user.id,
                        email: user.email,
                        success: result.success,
                        error: result.error || result.reason
                    });
                } catch (error) {
                    console.error(`Failed to notify user ${user.id}:`, error);
                    results.push({
                        userId: user.id,
                        email: user.email,
                        success: false,
                        error: error.message
                    });
                }
            }

            // Log summary
            const successCount = results.filter(r => r.success).length;
            const failureCount = results.length - successCount;
            
            console.log(`📊 Notification summary for site "${site.name}" (sent to all users):`);
            console.log(`   ✅ Successfully notified: ${successCount} users`);
            console.log(`   ❌ Failed to notify: ${failureCount} users`);

            return {
                success: true,
                siteName: site.name,
                totalUsers: users.length,
                successCount,
                failureCount,
                results
            };

        } catch (error) {
            console.error('Error in bulk notification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Create a detailed notification message
    createChangeNotificationMessage(site, changeDetails) {
        const timestamp = new Date().toLocaleString('ja-JP');
        
        let changeReason = 'コンテンツが更新されました';
        if (changeDetails.reason) {
            if (changeDetails.reason.includes('新しいキーワードが検出されました')) {
                changeReason = '新しいキーワードが検出されました';
            } else if (changeDetails.reason.includes('キーワードが削除されました')) {
                changeReason = 'キーワードが削除されました';
            } else if (changeDetails.reason.includes('以前のスナップショットと比較して内容が変更されました')) {
                changeReason = 'ページコンテンツが変更されました';
            }
        }

        return `🌐 ウェブサイト更新が検出されました！<br/>
📊 サイト: ${site.name}<br/>
🌐 URL: ${site.url}<br/>
🔄 変更: ${changeReason}<br/>
🕐 検出時刻: ${timestamp}<br/>
<br/>
監視中のウェブサイトが更新されました。<br/>
最新情報をご確認ください。<br/>
<br/>
この通知は、ウェブサイト監視システムによって自動的に送信されました。`;
    }

    // Notify a single user about a site change
    async notifyUser(user, siteId, message, changeDetails) {
        try {
            const results = {
                email: null,
                line: null
            };

            // Send email notification if enabled
            if (user.email_enabled && user.email) {
                try {
                    results.email = await this.notificationService.sendEmail(
                        user.id,
                        siteId,
                        message,
                        'ウェブサイト更新が検出されました'
                    );
                } catch (error) {
                    console.error(`Email notification failed for user ${user.id}:`, error);
                    results.email = { success: false, error: error.message };
                }
            }

            // Send LINE notification if enabled
            if (user.line_enabled && user.line_user_id) {
                try {
                    results.line = await this.notificationService.sendLineNotification(
                        user.id,
                        siteId,
                        message
                    );
                } catch (error) {
                    console.error(`LINE notification failed for user ${user.id}:`, error);
                    results.line = { success: false, error: error.message };
                }
            }

            // Determine overall success
            const hasSuccess = (results.email && results.email.success) || 
                             (results.line && results.line.success);

            return {
                success: hasSuccess,
                results
            };

        } catch (error) {
            console.error(`Error notifying user ${user.id}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Test bulk notification system
    async testBulkNotification(siteId) {
        try {
            console.log(`🧪 Testing bulk notification for site ID: ${siteId}`);
            
            const testChangeDetails = {
                reason: 'Test notification - Content changed',
                currentHash: 'test_hash_123',
                previousHash: 'test_hash_456'
            };

            const result = await this.notifySiteChange(siteId, testChangeDetails);
            
            if (result.success) {
                console.log('✅ Bulk notification test successful!');
                console.log(`   Site: ${result.siteName}`);
                console.log(`   Users notified: ${result.successCount}/${result.totalUsers}`);
            } else {
                console.log('❌ Bulk notification test failed:', result.reason || result.error);
            }

            return result;

        } catch (error) {
            console.error('❌ Bulk notification test failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new BulkNotificationService();
