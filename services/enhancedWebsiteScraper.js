const mysql = require('mysql2/promise');
const puppeteer = require('puppeteer');
const axios = require('axios');
const crypto = require('crypto');
const EnhancedChangeDetector = require('./enhancedChangeDetector');

class EnhancedWebsiteScraper {
    constructor(dbConfig) {
        this.dbConfig = dbConfig;
        this.pool = mysql.createPool(dbConfig);
        this.changeDetector = new EnhancedChangeDetector(dbConfig);
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    }

    /**
     * Enhanced scraping method that saves comprehensive status data
     * @param {number} siteId - The site ID to scrape
     * @param {string} url - The URL to scrape
     * @param {string} keywords - Keywords to search for (optional)
     * @returns {Object} Comprehensive scraping result
     */
    async scrapeAndSaveStatus(siteId, url, keywords = null) {
        const startTime = Date.now();
        let scrapingResult = null;
        let checkId = null;

        try {
            console.log(`\n🌐 Starting enhanced scraping for site ID: ${siteId}`);
            console.log(`   URL: ${url}`);
            console.log(`   Keywords: ${keywords || 'None'}`);

            // Perform the scraping
            scrapingResult = await this.performScraping(url);
            
            // Process keywords if provided
            const keywordAnalysis = keywords ? 
                this.analyzeKeywords(scrapingResult.content, keywords) : 
                { found: false, keywords: [], count: 0 };

            // Calculate content hash and length
            const contentHash = this.calculateContentHash(scrapingResult.content);
            const contentLength = scrapingResult.content ? scrapingResult.content.length : 0;

            // Save comprehensive scraping result
            checkId = await this.saveScrapingResult({
                siteId,
                contentHash,
                contentLength,
                statusCode: scrapingResult.statusCode,
                responseTime: scrapingResult.responseTime,
                scrapingMethod: scrapingResult.method,
                keywordsFound: keywordAnalysis.found,
                keywordsList: JSON.stringify(keywordAnalysis.keywords),
                errorMessage: scrapingResult.error || null,
                content: scrapingResult.content
            });

            // Update monitored_sites table with latest status
            await this.updateMonitoredSiteStatus(siteId, {
                lastCheck: new Date(),
                lastContentHash: contentHash,
                lastStatusCode: scrapingResult.statusCode,
                lastResponseTime: scrapingResult.responseTime,
                lastScrapingMethod: scrapingResult.method
            });

            // Perform comprehensive change detection
            const changeResult = await this.changeDetector.detectChanges(siteId);

            console.log(`   ✅ Scraping completed successfully`);
            console.log(`   📊 Status Code: ${scrapingResult.statusCode}`);
            console.log(`   ⏱️  Response Time: ${scrapingResult.responseTime}ms`);
            console.log(`   🔍 Method: ${scrapingResult.method}`);
            console.log(`   📝 Content Length: ${contentLength} characters`);
            console.log(`   🔑 Keywords Found: ${keywordAnalysis.found ? 'Yes' : 'No'}`);

            if (changeResult.hasChanged) {
                console.log(`   🔔 CHANGES DETECTED: ${changeResult.summary}`);
                console.log(`   📊 Change Types: ${changeResult.changeTypes.join(', ')}`);
                console.log(`   ⚠️  Severity: ${changeResult.severity}`);
            } else {
                console.log(`   ✅ No changes detected`);
            }

            return {
                success: true,
                checkId,
                contentHash,
                contentLength,
                statusCode: scrapingResult.statusCode,
                responseTime: scrapingResult.responseTime,
                scrapingMethod: scrapingResult.method,
                keywordsFound: keywordAnalysis.found,
                keywords: keywordAnalysis.keywords,
                hasChanged: changeResult.hasChanged,
                changeResult: changeResult,
                error: scrapingResult.error || null,
                textPreview: scrapingResult.content ? scrapingResult.content.substring(0, 200) + '...' : null
            };

        } catch (error) {
            console.error(`❌ Error during scraping for site ${siteId}:`, error);
            
            // Save error result
            if (siteId) {
                try {
                    checkId = await this.saveScrapingResult({
                        siteId,
                        contentHash: null,
                        contentLength: 0,
                        statusCode: null,
                        responseTime: Date.now() - startTime,
                        scrapingMethod: 'error',
                        keywordsFound: false,
                        keywordsList: JSON.stringify([]),
                        errorMessage: error.message,
                        content: null
                    });
                } catch (saveError) {
                    console.error('❌ Error saving error result:', saveError);
                }
            }

            return {
                success: false,
                checkId,
                error: error.message,
                hasChanged: false
            };
        }
    }

    /**
     * Perform the actual scraping using multiple methods
     */
    async performScraping(url) {
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

        throw new Error('All scraping methods failed');
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
                responseTime: responseTime,
                headers: response.headers()
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
            responseTime: responseTime,
            headers: response.headers
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
     * Save comprehensive scraping result to database
     */
    async saveScrapingResult(data) {
        try {
            const [result] = await this.pool.execute(`
                INSERT INTO site_checks 
                (site_id, content_hash, content_length, status_code, response_time_ms, 
                 scraping_method, keywords_found, keywords_list, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                data.siteId,
                data.contentHash,
                data.contentLength,
                data.statusCode,
                data.responseTime,
                data.scrapingMethod,
                data.keywordsFound,
                data.keywordsList,
                data.errorMessage
            ]);

            const checkId = result.insertId;

            // Save content snapshots if content is available
            if (data.content && data.content.length > 0) {
                await this.saveContentSnapshots(checkId, data.content);
            }

            return checkId;
        } catch (error) {
            console.error('❌ Error saving scraping result:', error);
            throw error;
        }
    }

    /**
     * Save content snapshots for detailed comparison
     */
    async saveContentSnapshots(checkId, content) {
        try {
            // Save full HTML content
            await this.pool.execute(`
                INSERT INTO scraped_content 
                (site_check_id, content_type, content_data, content_size)
                VALUES (?, 'full_html', ?, ?)
            `, [checkId, content, content.length]);

            // Extract and save text content
            const textContent = this.extractTextContent(content);
            if (textContent) {
                await this.pool.execute(`
                    INSERT INTO scraped_content 
                    (site_check_id, content_type, content_data, content_size)
                    VALUES (?, 'text_content', ?, ?)
                `, [checkId, textContent, textContent.length]);
            }

            console.log(`   💾 Saved content snapshots for check ID: ${checkId}`);
        } catch (error) {
            console.error('❌ Error saving content snapshots:', error);
        }
    }

    /**
     * Extract text content from HTML
     */
    extractTextContent(html) {
        try {
            // Simple text extraction (you might want to use a proper HTML parser)
            return html
                .replace(/<script[^>]*>.*?<\/script>/gi, '')
                .replace(/<style[^>]*>.*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        } catch (error) {
            console.error('❌ Error extracting text content:', error);
            return null;
        }
    }

    /**
     * Update monitored_sites table with latest status
     */
    async updateMonitoredSiteStatus(siteId, statusData) {
        try {
            await this.pool.execute(`
                UPDATE monitored_sites 
                SET last_check = ?, 
                    last_content_hash = ?, 
                    last_status_code = ?, 
                    last_response_time_ms = ?, 
                    last_scraping_method = ?,
                    updated_at = NOW()
                WHERE id = ?
            `, [
                statusData.lastCheck,
                statusData.lastContentHash,
                statusData.lastStatusCode,
                statusData.lastResponseTime,
                statusData.lastScrapingMethod,
                siteId
            ]);
        } catch (error) {
            console.error('❌ Error updating monitored site status:', error);
        }
    }

    /**
     * Get scraping history for a site
     */
    async getScrapingHistory(siteId, limit = 10) {
        try {
            const [history] = await this.pool.execute(`
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
     * Get detailed comparison between two checks
     */
    async getDetailedComparison(checkId1, checkId2) {
        return await this.changeDetector.getDetailedComparison(checkId1, checkId2);
    }

    /**
     * Get change history for a site
     */
    async getChangeHistory(siteId, limit = 10) {
        return await this.changeDetector.getChangeHistory(siteId, limit);
    }

    /**
     * Batch scrape multiple sites
     */
    async batchScrapeSites(sites) {
        const results = [];
        
        for (const site of sites) {
            try {
                const result = await this.scrapeAndSaveStatus(
                    site.id, 
                    site.url, 
                    site.keywords
                );
                results.push({
                    siteId: site.id,
                    siteName: site.name,
                    success: result.success,
                    hasChanged: result.hasChanged,
                    changeResult: result.changeResult
                });
            } catch (error) {
                results.push({
                    siteId: site.id,
                    siteName: site.name,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }
}

module.exports = EnhancedWebsiteScraper;
