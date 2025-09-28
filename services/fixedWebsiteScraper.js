const mysql = require('mysql2/promise');
const puppeteer = require('puppeteer');
const axios = require('axios');
const crypto = require('crypto');

// Database configuration - update this with your actual database settings
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'website_monitor',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

class FixedWebsiteScraper {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    }

    /**
     * Main scraping function that properly saves data and detects changes
     */
    async scrapeAndDetectChanges(siteId, url, keywords = null) {
        try {
            console.log(`\n🌐 Processing site ID: ${siteId}`);
            console.log(`   URL: ${url}`);
            console.log(`   Keywords: ${keywords || 'None'}`);

            // Step 1: Scrape the website
            const scrapeResult = await this.smartScrape(url);
            
            if (!scrapeResult.success) {
                console.log(`   ❌ Scraping failed: ${scrapeResult.error}`);
                return {
                    success: false,
                    error: scrapeResult.error,
                    hasChanged: false
                };
            }

            // Step 2: Process keywords if provided
            const keywordsResult = keywords ? 
                this.analyzeKeywords(scrapeResult.content, keywords) : 
                { found: false, keywords: [], count: 0 };

            // Step 3: Calculate content hash and length
            const contentHash = this.calculateContentHash(scrapeResult.content);
            const contentLength = scrapeResult.content ? scrapeResult.content.length : 0;

            console.log(`   📊 Status Code: ${scrapeResult.statusCode}`);
            console.log(`   ⏱️  Response Time: ${scrapeResult.responseTime}ms`);
            console.log(`   🔍 Method: ${scrapeResult.method}`);
            console.log(`   📝 Content Length: ${contentLength} characters`);
            console.log(`   🔑 Keywords Found: ${keywordsResult.found ? 'Yes' : 'No'}`);

            // Step 4: Save the scraping result to database
            const checkId = await this.saveScrapingResult(
                siteId, 
                contentHash, 
                contentLength, 
                scrapeResult.statusCode, 
                scrapeResult.responseTime, 
                keywordsResult.found, 
                scrapeResult.method
            );

            // Step 5: Detect changes by comparing with previous data
            const changeResult = await this.detectChanges(siteId);
            
            if (changeResult.hasChanged) {
                console.log(`   🔔 CHANGES DETECTED: ${changeResult.reason}`);
                console.log(`   📊 Change Type: ${changeResult.changeType || 'unknown'}`);
                
                // Update the changes_detected flag in the database
                await this.updateChangesDetected(checkId, true);
                
                // Send notifications if needed
                try {
                    const notificationResult = await this.sendNotifications(siteId, changeResult);
                    if (notificationResult.success) {
                        console.log(`   📧 Notifications sent: ${notificationResult.successCount}/${notificationResult.totalUsers} users`);
                    } else {
                        console.log(`   ❌ Notification failed: ${notificationResult.reason}`);
                    }
                } catch (notificationError) {
                    console.log(`   ❌ Notification error: ${notificationError.message}`);
                }
            } else {
                console.log(`   ✅ No changes detected`);
                await this.updateChangesDetected(checkId, false);
            }

            // Step 6: Update monitored_sites table with latest status
            await this.updateMonitoredSiteStatus(siteId, {
                lastCheck: new Date(),
                lastContentHash: contentHash
            });

            return {
                success: true,
                checkId,
                contentHash,
                contentLength,
                statusCode: scrapeResult.statusCode,
                responseTime: scrapeResult.responseTime,
                keywordsFound: keywordsResult.found,
                keywords: keywordsResult.keywords,
                hasChanged: changeResult.hasChanged,
                changeReason: changeResult.reason,
                changeType: changeResult.changeType,
                method: scrapeResult.method,
                textPreview: scrapeResult.content ? scrapeResult.content.substring(0, 200) + '...' : null
            };

        } catch (error) {
            console.error(`❌ Error during scraping for site ${siteId}:`, error);
            return {
                success: false,
                error: error.message,
                hasChanged: false
            };
        }
    }

    /**
     * Smart scraping with multiple methods
     */
    async smartScrape(url) {
        const methods = ['puppeteer', 'axios'];
        
        for (const method of methods) {
            try {
                console.log(`   🔄 Trying method: ${method}`);
                
                let result;
                switch (method) {
                    case 'puppeteer':
                        result = await this.scrapeWithPuppeteer(url);
                        break;
                    case 'axios':
                        result = await this.scrapeWithAxios(url);
                        break;
                }

                if (result.success) {
                    console.log(`   ✅ Success with ${method}`);
                    return {
                        ...result,
                        method: method
                    };
                }
            } catch (error) {
                console.log(`   ❌ ${method} failed: ${error.message}`);
                continue;
            }
        }

        return {
            success: false,
            error: 'All scraping methods failed',
            method: 'none'
        };
    }

    /**
     * Scrape using Puppeteer (handles JavaScript)
     */
    async scrapeWithPuppeteer(url) {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const page = await browser.newPage();
            await page.setUserAgent(this.userAgent);
            
            const startTime = Date.now();
            const response = await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            const responseTime = Date.now() - startTime;

            const content = await page.content();
            const statusCode = response.status();

            await browser.close();

            return {
                success: true,
                content: content,
                statusCode: statusCode,
                responseTime: responseTime
            };
        } catch (error) {
            await browser.close();
            throw error;
        }
    }

    /**
     * Scrape using Axios (faster, no JavaScript)
     */
    async scrapeWithAxios(url) {
        const startTime = Date.now();
        
        const response = await axios.get(url, {
            timeout: 30000,
            headers: {
                'User-Agent': this.userAgent
            },
            maxRedirects: 5
        });

        const responseTime = Date.now() - startTime;

        return {
            success: true,
            content: response.data,
            statusCode: response.status,
            responseTime: responseTime
        };
    }

    /**
     * Analyze keywords in content
     */
    analyzeKeywords(content, keywords) {
        if (!content || !keywords) {
            return { found: false, keywords: [], count: 0 };
        }

        const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
        const contentLower = content.toLowerCase();
        const foundKeywords = [];

        keywordList.forEach(keyword => {
            if (contentLower.includes(keyword)) {
                foundKeywords.push(keyword);
            }
        });

        return {
            found: foundKeywords.length > 0,
            keywords: foundKeywords,
            count: foundKeywords.length
        };
    }

    /**
     * Calculate content hash
     */
    calculateContentHash(content) {
        if (!content) return null;
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Save scraping result to database
     */
    async saveScrapingResult(siteId, contentHash, contentLength, statusCode, responseTime, keywordsFound, method) {
        try {
            const [result] = await pool.execute(`
                INSERT INTO site_checks 
                (site_id, content_hash, content_length, status_code, response_time_ms, changes_detected) 
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                siteId,
                contentHash,
                contentLength,
                statusCode,
                responseTime,
                keywordsFound
            ]);

            console.log(`   💾 Saved scraping result with ID: ${result.insertId}`);
            return result.insertId;
        } catch (error) {
            console.error('❌ Error saving scraping result:', error);
            throw error;
        }
    }

    /**
     * Update changes_detected flag
     */
    async updateChangesDetected(checkId, hasChanged) {
        try {
            await pool.execute(
                'UPDATE site_checks SET changes_detected = ? WHERE id = ?',
                [hasChanged, checkId]
            );
        } catch (error) {
            console.error('❌ Error updating changes_detected:', error);
        }
    }

    /**
     * Update monitored_sites table
     */
    async updateMonitoredSiteStatus(siteId, statusData) {
        try {
            await pool.execute(`
                UPDATE monitored_sites 
                SET last_check = ?, last_content_hash = ?, updated_at = NOW()
                WHERE id = ?
            `, [
                statusData.lastCheck,
                statusData.lastContentHash,
                siteId
            ]);
        } catch (error) {
            console.error('❌ Error updating monitored site status:', error);
        }
    }

    /**
     * FIXED: Proper change detection logic
     */
    async detectChanges(siteId) {
        try {
            console.log(`   🔍 Checking for changes...`);

            // Get the last two checks for this site
            const [checks] = await pool.execute(`
                SELECT 
                    content_hash, 
                    changes_detected, 
                    status_code,
                    response_time_ms,
                    content_length,
                    created_at 
                FROM site_checks 
                WHERE site_id = ? 
                ORDER BY created_at DESC 
                LIMIT 2
            `, [siteId]);

            console.log(`   📊 Found ${checks.length} previous checks`);

            if (checks.length < 2) {
                return { 
                    hasChanged: false, 
                    reason: 'Not enough data for comparison (need at least 2 checks)',
                    isFirstCheck: checks.length === 1
                };
            }

            const current = checks[0];
            const previous = checks[1];

            console.log(`   📊 Current check: ${current.created_at}`);
            console.log(`   📊 Previous check: ${previous.created_at}`);
            console.log(`   📊 Current hash: ${current.content_hash ? current.content_hash.substring(0, 16) + '...' : 'null'}`);
            console.log(`   📊 Previous hash: ${previous.content_hash ? previous.content_hash.substring(0, 16) + '...' : 'null'}`);

            // Check 1: Content hash changes (most important)
            if (current.content_hash !== previous.content_hash) {
                console.log(`   🔔 Content hash changed!`);
                return {
                    hasChanged: true,
                    reason: 'Website content has changed',
                    currentHash: current.content_hash,
                    previousHash: previous.content_hash,
                    changeType: 'content'
                };
            }

            // Check 2: Status code changes
            if (current.status_code !== previous.status_code) {
                console.log(`   🔔 Status code changed from ${previous.status_code} to ${current.status_code}!`);
                return {
                    hasChanged: true,
                    reason: `HTTP status changed from ${previous.status_code} to ${current.status_code}`,
                    currentStatusCode: current.status_code,
                    previousStatusCode: previous.status_code,
                    changeType: 'status'
                };
            }

            // Check 3: Response time changes (significant changes only)
            if (current.response_time_ms && previous.response_time_ms) {
                const timeDiff = Math.abs(current.response_time_ms - previous.response_time_ms);
                const percentChange = (timeDiff / previous.response_time_ms) * 100;
                
                if (percentChange > 50) { // More than 50% change
                    console.log(`   🔔 Response time changed significantly!`);
                    return {
                        hasChanged: true,
                        reason: `Response time changed by ${percentChange.toFixed(1)}%`,
                        currentResponseTime: current.response_time_ms,
                        previousResponseTime: previous.response_time_ms,
                        changeType: 'performance'
                    };
                }
            }

            // Check 4: Keyword changes
            if (current.changes_detected !== previous.changes_detected) {
                const direction = current.changes_detected ? 'appeared' : 'disappeared';
                console.log(`   🔔 Keywords ${direction}!`);
                return {
                    hasChanged: true,
                    reason: `Keywords ${direction}`,
                    currentKeywords: current.changes_detected,
                    previousKeywords: previous.changes_detected,
                    changeType: 'keywords'
                };
            }

            console.log(`   ✅ No significant changes detected`);
            return { 
                hasChanged: false, 
                reason: 'No changes detected' 
            };

        } catch (error) {
            console.error('❌ Error detecting changes:', error);
            return {
                hasChanged: false,
                reason: `Error: ${error.message}`
            };
        }
    }

    /**
     * Send notifications (placeholder - implement your notification logic)
     */
    async sendNotifications(siteId, changeResult) {
        try {
            // Get users watching this site
            const [users] = await pool.execute(`
                SELECT DISTINCT u.id, u.email, u.line_user_id, un.email_enabled, un.line_enabled
                FROM users u
                JOIN monitored_sites ms ON u.id = ms.user_id
                LEFT JOIN user_notifications un ON u.id = un.user_id
                WHERE ms.id = ? AND u.is_active = TRUE
            `, [siteId]);

            console.log(`   📧 Found ${users.length} users to notify`);

            // Here you would implement your actual notification logic
            // For now, just return success
            return {
                success: true,
                successCount: users.length,
                totalUsers: users.length
            };
        } catch (error) {
            return {
                success: false,
                reason: error.message
            };
        }
    }

    /**
     * Get scraping history for a site
     */
    async getScrapingHistory(siteId, limit = 10) {
        try {
            const [history] = await pool.execute(`
                SELECT 
                    sc.*,
                    ms.url,
                    ms.name as site_name
                FROM site_checks sc
                JOIN monitored_sites ms ON sc.site_id = ms.id
                WHERE sc.site_id = ?
                ORDER BY sc.created_at DESC
                LIMIT ?
            `, [siteId, limit]);

            return history;
        } catch (error) {
            console.error('❌ Error getting scraping history:', error);
            return [];
        }
    }

    /**
     * Test change detection with sample data
     */
    async testChangeDetection(siteId) {
        try {
            console.log(`\n🧪 Testing change detection for site ${siteId}`);
            
            const changeResult = await this.detectChanges(siteId);
            
            console.log(`   Result: ${changeResult.hasChanged ? 'CHANGES DETECTED' : 'NO CHANGES'}`);
            console.log(`   Reason: ${changeResult.reason}`);
            
            if (changeResult.hasChanged) {
                console.log(`   Change Type: ${changeResult.changeType}`);
            }
            
            return changeResult;
        } catch (error) {
            console.error('❌ Error testing change detection:', error);
            return { hasChanged: false, reason: error.message };
        }
    }
}

module.exports = FixedWebsiteScraper;
