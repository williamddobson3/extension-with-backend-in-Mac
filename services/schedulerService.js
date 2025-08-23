const cron = require('node-cron');
const { pool } = require('../config/database');
const websiteMonitor = require('./websiteMonitor');
const notificationService = require('./notificationService');

class SchedulerService {
    constructor() {
        this.jobs = new Map();
        this.isRunning = false;
    }

    // Start the scheduler
    start() {
        if (this.isRunning) {
            console.log('Scheduler is already running');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Starting website monitoring scheduler...');

        // Run initial check for all active sites
        this.runInitialChecks();

        // Schedule periodic checks every hour
        cron.schedule('0 * * * *', () => {
            this.runPeriodicChecks();
        }, {
            scheduled: true,
            timezone: "Asia/Tokyo"
        });

        console.log('✅ Scheduler started successfully');
    }

    // Stop the scheduler
    stop() {
        this.isRunning = false;
        console.log('🛑 Scheduler stopped');
    }

    // Run initial checks for all active sites
    async runInitialChecks() {
        try {
            console.log('🔍 Running initial checks for all active sites...');
            
            const [sites] = await pool.execute(
                `SELECT id, user_id, url, name, keywords 
                 FROM monitored_sites 
                 WHERE is_active = true`
            );

            console.log(`Found ${sites.length} active sites to check`);

            for (const site of sites) {
                await this.checkSite(site);
                // Add small delay to avoid overwhelming servers
                await this.delay(1000);
            }

            console.log('✅ Initial checks completed');
        } catch (error) {
            console.error('❌ Error during initial checks:', error);
        }
    }

    // Run periodic checks based on site intervals
    async runPeriodicChecks() {
        try {
            console.log('🔄 Running periodic checks...');
            
            const [sites] = await pool.execute(
                `SELECT id, user_id, url, name, keywords, check_interval_hours, last_check
                 FROM monitored_sites 
                 WHERE is_active = true`
            );

            const now = new Date();
            const sitesToCheck = sites.filter(site => {
                if (!site.last_check) return true;
                
                const lastCheck = new Date(site.last_check);
                const hoursSinceLastCheck = (now - lastCheck) / (1000 * 60 * 60);
                
                return hoursSinceLastCheck >= site.check_interval_hours;
            });

            console.log(`Found ${sitesToCheck.length} sites due for checking`);

            for (const site of sitesToCheck) {
                await this.checkSite(site);
                // Add small delay to avoid overwhelming servers
                await this.delay(2000);
            }

            console.log('✅ Periodic checks completed');
        } catch (error) {
            console.error('❌ Error during periodic checks:', error);
        }
    }

    // Check a single site
    async checkSite(site) {
        try {
            console.log(`🔍 Checking site: ${site.name} (${site.url})`);
            
            // Check the website
            const result = await websiteMonitor.checkWebsite(
                site.id, 
                site.url, 
                site.keywords
            );

            if (!result.success) {
                console.log(`❌ Failed to check ${site.name}: ${result.error}`);
                return;
            }

            // Check for changes
            const changeResult = await websiteMonitor.detectChanges(site.id);
            
            if (changeResult.hasChanged) {
                console.log(`🔔 Changes detected for ${site.name}!`);
                
                // Prepare notification message
                const message = this.createNotificationMessage(site, result, changeResult);
                
                // Send notifications
                const notificationResult = await notificationService.sendNotification(
                    site.user_id,
                    site.id,
                    message,
                    'Website Update Detected'
                );

                console.log(`📧 Notifications sent for ${site.name}:`, {
                    email: notificationResult.email?.success ? '✅' : '❌',
                    line: notificationResult.line?.success ? '✅' : '❌'
                });
            } else {
                console.log(`✅ No changes detected for ${site.name}`);
            }

        } catch (error) {
            console.error(`❌ Error checking site ${site.name}:`, error);
        }
    }

    // Create notification message
    createNotificationMessage(site, checkResult, changeResult) {
        let message = `Website update detected for "${site.name}"\n\n`;
        
        message += `🌐 URL: ${site.url}\n`;
        message += `📊 Status Code: ${checkResult.statusCode}\n`;
        message += `⏱️ Response Time: ${checkResult.responseTime}ms\n`;
        message += `📏 Content Length: ${checkResult.contentLength} characters\n`;
        
        if (checkResult.keywordsFound) {
            message += `🔍 Keywords found in content\n`;
        }
        
        message += `\n📝 Content Preview:\n${checkResult.textContent}...\n\n`;
        message += `🕐 Checked at: ${new Date().toLocaleString('ja-JP')}`;
        
        return message;
    }

    // Manual check for a specific site
    async manualCheck(siteId) {
        try {
            const [sites] = await pool.execute(
                'SELECT id, user_id, url, name, keywords FROM monitored_sites WHERE id = ?',
                [siteId]
            );

            if (sites.length === 0) {
                throw new Error('Site not found');
            }

            await this.checkSite(sites[0]);
            return { success: true };
        } catch (error) {
            console.error('Manual check error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get scheduler status
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeJobs: this.jobs.size,
            uptime: process.uptime()
        };
    }

    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get sites that are due for checking
    async getSitesDueForCheck() {
        try {
            const [sites] = await pool.execute(
                `SELECT id, user_id, url, name, check_interval_hours, last_check
                 FROM monitored_sites 
                 WHERE is_active = true`
            );

            const now = new Date();
            return sites.filter(site => {
                if (!site.last_check) return true;
                
                const lastCheck = new Date(site.last_check);
                const hoursSinceLastCheck = (now - lastCheck) / (1000 * 60 * 60);
                
                return hoursSinceLastCheck >= site.check_interval_hours;
            });
        } catch (error) {
            console.error('Error getting sites due for check:', error);
            return [];
        }
    }
}

module.exports = new SchedulerService();
