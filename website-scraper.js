#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const crypto = require('crypto');
const { pool } = require('./config/database');
const bulkNotificationService = require('./services/bulkNotificationService');

console.log('🌐 Website Scraper & Change Detector');
console.log('=====================================\n');

class WebsiteScraper {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        this.browser = null;
        this.scrapingMethods = {
            'axios': this.scrapeWithAxios.bind(this),
            'puppeteer': this.scrapeWithPuppeteer.bind(this),
            'fallback': this.scrapeWithFallback.bind(this)
        };
    }

    // Initialize Puppeteer browser
    async initBrowser() {
        if (this.browser) return this.browser;

        try {
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });
            console.log('✅ Puppeteer browser initialized');
            return this.browser;
        } catch (error) {
            console.error('❌ Failed to initialize Puppeteer browser:', error.message);
            return null;
        }
    }

    // Close browser
    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            console.log('🔒 Browser closed');
        }
    }

    // Scrape with Axios (fastest, good for static sites)
    async scrapeWithAxios(url) {
        try {
            const startTime = Date.now();
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                timeout: 30000,
                maxRedirects: 5,
                validateStatus: (status) => status < 400
            });

            const responseTime = Date.now() - startTime;
            
            return {
                success: true,
                content: response.data,
                statusCode: response.status,
                responseTime,
                method: 'axios',
                headers: response.headers
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                method: 'axios',
                statusCode: error.response?.status || 0
            };
        }
    }

    // Scrape with Puppeteer (good for JavaScript-heavy sites)
    async scrapeWithPuppeteer(url) {
        try {
            const browser = await this.initBrowser();
            if (!browser) {
                throw new Error('Browser not available');
            }

            const startTime = Date.now();
            const page = await browser.newPage();
            
            // Set viewport and user agent
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent(this.userAgent);
            
            // Set extra headers
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            });

            // Navigate to page with timeout
            const response = await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Wait for content to load
            await page.waitForTimeout(2000);
            
            // Get page content
            const content = await page.content();
            const responseTime = Date.now() - startTime;
            
            // Close page but keep browser
            await page.close();

            return {
                success: true,
                content,
                statusCode: response.status(),
                responseTime,
                method: 'puppeteer',
                headers: response.headers()
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                method: 'puppeteer',
                statusCode: 0
            };
        }
    }

    // Fallback scraping method (basic HTTP request)
    async scrapeWithFallback(url) {
        try {
            const startTime = Date.now();
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': '*/*'
                },
                timeout: 15000,
                maxRedirects: 3,
                validateStatus: () => true // Accept any status
            });

            const responseTime = Date.now() - startTime;
            
            return {
                success: true,
                content: response.data,
                statusCode: response.status,
                responseTime,
                method: 'fallback',
                headers: response.headers
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                method: 'fallback',
                statusCode: 0
            };
        }
    }

    // Smart scraping - tries different methods
    async smartScrape(url) {
        console.log(`🔍 Scraping: ${url}`);
        
        // Try Axios first (fastest)
        let result = await this.scrapeWithAxios(url);
        if (result.success) {
            console.log(`   ✅ Axios successful (${result.responseTime}ms)`);
            return result;
        }

        // Try Puppeteer for JavaScript-heavy sites
        console.log(`   ⏳ Axios failed, trying Puppeteer...`);
        result = await this.scrapeWithPuppeteer(url);
        if (result.success) {
            console.log(`   ✅ Puppeteer successful (${result.responseTime}ms)`);
            return result;
        }

        // Try fallback method
        console.log(`   ⏳ Puppeteer failed, trying fallback...`);
        result = await this.scrapeWithFallback(url);
        if (result.success) {
            console.log(`   ✅ Fallback successful (${result.responseTime}ms)`);
            return result;
        }

        // All methods failed
        console.log(`   ❌ All scraping methods failed`);
        return result;
    }

    // Extract and clean text content
    extractTextContent(html, method) {
        try {
            if (method === 'puppeteer') {
                // For Puppeteer, we already have rendered content
                return this.cleanText(html);
            }

            // For Axios/fallback, parse with Cheerio
            const $ = cheerio.load(html);
            
            // Remove unwanted elements
            $('script, style, noscript, iframe, img, svg, canvas, audio, video').remove();
            $('meta, link, title, head').remove();
            
            // Get text content
            let text = $('body').text() || $('html').text() || html;
            
            return this.cleanText(text);
        } catch (error) {
            console.error('Error extracting text content:', error.message);
            return this.cleanText(html);
        }
    }

    // Clean and normalize text
    cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/\s+/g, ' ')           // Normalize whitespace
            .replace(/\n+/g, ' ')           // Replace newlines with spaces
            .replace(/\t+/g, ' ')           // Replace tabs with spaces
            .replace(/\r+/g, ' ')           // Replace carriage returns
            .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\uF900-\uFAFF\u3300-\u33FF\uFE30-\uFE4F\uFF00-\uFFEF\u0020-\u007F]/g, ' ') // Keep alphanumeric, spaces, and CJK characters
            .trim();
    }

    // Generate content hash
    generateHash(content) {
        return crypto.createHash('md5').update(content).digest('hex');
    }

    // Check for keywords
    checkKeywords(content, keywords) {
        if (!keywords || !content) return false;
        
        const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
        const contentLower = content.toLowerCase();
        
        const foundKeywords = keywordList.filter(keyword => contentLower.includes(keyword));
        return {
            found: foundKeywords.length > 0,
            keywords: foundKeywords,
            total: keywordList.length
        };
    }

    // Save scraping result to database
    async saveScrapingResult(siteId, contentHash, contentLength, statusCode, responseTime, keywordsFound, method) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO site_checks (site_id, content_hash, content_length, status_code, response_time_ms, changes_detected) VALUES (?, ?, ?, ?, ?, ?)',
                [siteId, contentHash, contentLength, statusCode, responseTime, keywordsFound.found]
            );

            // Update last check time
            await pool.execute(
                'UPDATE monitored_sites SET last_check = NOW() WHERE id = ?',
                [siteId]
            );

            return result.insertId;
        } catch (error) {
            console.error('Error saving scraping result:', error);
            throw error;
        }
    }

    // Detect changes by comparing with previous scrapes
    async detectChanges(siteId) {
        try {
            const [checks] = await pool.execute(
                'SELECT content_hash, changes_detected, created_at FROM site_checks WHERE site_id = ? ORDER BY created_at DESC LIMIT 2',
                [siteId]
            );

            if (checks.length < 2) {
                return { 
                    hasChanged: false, 
                    reason: 'Not enough data for comparison',
                    isFirstCheck: checks.length === 1
                };
            }

            const current = checks[0];
            const previous = checks[1];
            
            // Check content hash changes
            if (current.content_hash !== previous.content_hash) {
                return {
                    hasChanged: true,
                    reason: 'Content has changed',
                    currentHash: current.content_hash,
                    previousHash: previous.content_hash,
                    changeType: 'content'
                };
            }

            // Check keyword changes
            if (current.changes_detected !== previous.changes_detected) {
                const direction = current.changes_detected ? 'appeared' : 'disappeared';
                return {
                    hasChanged: true,
                    reason: `Keywords ${direction}`,
                    currentKeywords: current.changes_detected,
                    previousKeywords: previous.changes_detected,
                    changeType: 'keywords'
                };
            }

            return { 
                hasChanged: false, 
                reason: 'No changes detected' 
            };

        } catch (error) {
            console.error('Error detecting changes:', error);
            throw error;
        }
    }

    // Main scraping and change detection function
    async scrapeAndDetectChanges(siteId, url, keywords = null) {
        try {
            console.log(`\n🌐 Processing site ID: ${siteId}`);
            console.log(`   URL: ${url}`);
            console.log(`   Keywords: ${keywords || 'None'}`);

            // Scrape the website
            const scrapeResult = await this.smartScrape(url);
            
            if (!scrapeResult.success) {
                console.log(`   ❌ Scraping failed: ${scrapeResult.error}`);
                
                // Save failed attempt
                await this.saveScrapingResult(siteId, null, 0, scrapeResult.statusCode, 0, { found: false, keywords: [], total: 0 }, 'failed');
                
                return {
                    success: false,
                    error: scrapeResult.error,
                    method: scrapeResult.method
                };
            }

            // Extract and process content
            const textContent = this.extractTextContent(scrapeResult.content, scrapeResult.method);
            const contentHash = this.generateHash(textContent);
            const contentLength = textContent.length;
            const keywordsResult = this.checkKeywords(textContent, keywords);

            console.log(`   📊 Content length: ${contentLength} characters`);
            console.log(`   🔑 Keywords: ${keywordsResult.found ? `Found ${keywordsResult.keywords.length}/${keywordsResult.total}` : 'None found'}`);
            console.log(`   ⏱️ Response time: ${scrapeResult.responseTime}ms`);
            console.log(`   📝 Method: ${scrapeResult.method}`);

            // Save result to database
            await this.saveScrapingResult(
                siteId, 
                contentHash, 
                contentLength, 
                scrapeResult.statusCode, 
                scrapeResult.responseTime, 
                keywordsResult, 
                scrapeResult.method
            );

            // Detect changes
            const changeResult = await this.detectChanges(siteId);
            
            if (changeResult.hasChanged) {
                console.log(`   🔔 CHANGES DETECTED: ${changeResult.reason}`);
                
                // Send notifications
                try {
                    const notificationResult = await bulkNotificationService.notifySiteChange(siteId, changeResult);
                    
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
            }

            return {
                success: true,
                contentHash,
                contentLength,
                statusCode: scrapeResult.statusCode,
                responseTime: scrapeResult.responseTime,
                keywordsFound: keywordsResult.found,
                keywords: keywordsResult.keywords,
                hasChanged: changeResult.hasChanged,
                changeReason: changeResult.reason,
                method: scrapeResult.method,
                textPreview: textContent.substring(0, 200) + '...'
            };

        } catch (error) {
            console.error(`❌ Error processing site ${siteId}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Scrape all active sites
    async scrapeAllSites() {
        try {
            console.log('\n🚀 Starting bulk scraping of all active sites...\n');
            
            const [sites] = await pool.execute(
                'SELECT id, name, url, keywords, check_interval_hours, last_check FROM monitored_sites WHERE is_active = true ORDER BY last_check ASC NULLS FIRST'
            );

            if (sites.length === 0) {
                console.log('❌ No active sites found in database');
                return;
            }

            console.log(`📊 Found ${sites.length} active sites to scrape\n`);

            const results = [];
            for (const site of sites) {
                try {
                    const result = await this.scrapeAndDetectChanges(site.id, site.url, site.keywords);
                    results.push({
                        siteId: site.id,
                        siteName: site.name,
                        success: result.success,
                        hasChanged: result.hasChanged,
                        changeReason: result.changeReason,
                        method: result.method,
                        error: result.error
                    });

                    // Add delay between requests to be respectful
                    await this.delay(2000);
                    
                } catch (error) {
                    console.error(`❌ Failed to process site ${site.name}:`, error.message);
                    results.push({
                        siteId: site.id,
                        siteName: site.name,
                        success: false,
                        error: error.message
                    });
                }
            }

            // Print summary
            this.printSummary(results);
            
            return results;

        } catch (error) {
            console.error('❌ Error in bulk scraping:', error.message);
            throw error;
        } finally {
            await this.closeBrowser();
        }
    }

    // Print scraping summary
    printSummary(results) {
        console.log('\n📋 Scraping Summary');
        console.log('===================');
        
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        const changed = results.filter(r => r.success && r.hasChanged);
        
        console.log(`✅ Successful scrapes: ${successful.length}`);
        console.log(`❌ Failed scrapes: ${failed.length}`);
        console.log(`🔔 Sites with changes: ${changed.length}`);
        
        if (changed.length > 0) {
            console.log('\n🔄 Sites with detected changes:');
            changed.forEach(site => {
                console.log(`   • ${site.siteName}: ${site.changeReason}`);
            });
        }
        
        if (failed.length > 0) {
            console.log('\n❌ Failed sites:');
            failed.forEach(site => {
                console.log(`   • ${site.siteName}: ${site.error}`);
            });
        }
        
        console.log('\n🎉 Scraping session completed!');
    }

    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main execution
async function main() {
    const scraper = new WebsiteScraper();
    
    try {
        // Check database connection
        await pool.execute('SELECT 1');
        console.log('✅ Database connection successful');
        
        // Start scraping
        await scraper.scrapeAllSites();
        
    } catch (error) {
        console.error('❌ Main execution failed:', error.message);
        process.exit(1);
    } finally {
        await scraper.closeBrowser();
        process.exit(0);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = WebsiteScraper;
