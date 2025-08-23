const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const crypto = require('crypto');
const { pool } = require('../config/database');

class WebsiteMonitor {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    }

    // Generate hash from content
    generateHash(content) {
        return crypto.createHash('md5').update(content).digest('hex');
    }

    // Extract text content from HTML
    extractTextContent(html) {
        const $ = cheerio.load(html);
        
        // Remove script and style elements
        $('script, style').remove();
        
        // Get text content
        let text = $('body').text();
        
        // Clean up whitespace
        text = text.replace(/\s+/g, ' ').trim();
        
        return text;
    }

    // Check for specific keywords
    checkKeywords(content, keywords) {
        if (!keywords) return false;
        
        const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
        const contentLower = content.toLowerCase();
        
        return keywordList.some(keyword => contentLower.includes(keyword));
    }

    // Fetch website content using axios (faster for simple sites)
    async fetchWithAxios(url) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                },
                timeout: 30000,
                maxRedirects: 5
            });
            
            return {
                success: true,
                content: response.data,
                statusCode: response.status,
                responseTime: Date.now()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                statusCode: error.response?.status || 0
            };
        }
    }

    // Fetch website content using Puppeteer (for JavaScript-heavy sites)
    async fetchWithPuppeteer(url) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });

            const page = await browser.newPage();
            await page.setUserAgent(this.userAgent);
            await page.setViewport({ width: 1920, height: 1080 });
            
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
                content,
                statusCode,
                responseTime
            };
        } catch (error) {
            if (browser) await browser.close();
            return {
                success: false,
                error: error.message,
                statusCode: 0
            };
        }
    }

    // Main monitoring function
    async checkWebsite(siteId, url, keywords = null) {
        const startTime = Date.now();
        
        try {
            // Try axios first (faster)
            let result = await this.fetchWithAxios(url);
            
            // If axios fails, try Puppeteer
            if (!result.success) {
                console.log(`Axios failed for ${url}, trying Puppeteer...`);
                result = await this.fetchWithPuppeteer(url);
            }

            if (!result.success) {
                throw new Error(`Failed to fetch ${url}: ${result.error}`);
            }

            // Extract text content
            const textContent = this.extractTextContent(result.content);
            const contentHash = this.generateHash(textContent);
            const contentLength = textContent.length;
            const responseTime = result.responseTime || (Date.now() - startTime);

            // Check for keywords
            const keywordsFound = this.checkKeywords(textContent, keywords);

            // Save check result to database
            await this.saveCheckResult(siteId, contentHash, contentLength, result.statusCode, responseTime, keywordsFound);

            return {
                success: true,
                contentHash,
                contentLength,
                statusCode: result.statusCode,
                responseTime,
                keywordsFound,
                textContent: textContent.substring(0, 500) // First 500 chars for preview
            };

        } catch (error) {
            console.error(`Error checking website ${url}:`, error);
            
            // Save failed check
            await this.saveCheckResult(siteId, null, 0, 0, 0, false);
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Save check result to database
    async saveCheckResult(siteId, contentHash, contentLength, statusCode, responseTime, keywordsFound) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO site_checks (site_id, content_hash, content_length, status_code, response_time_ms, changes_detected) VALUES (?, ?, ?, ?, ?, ?)',
                [siteId, contentHash, contentLength, statusCode, responseTime, keywordsFound]
            );

            // Update last check time
            await pool.execute(
                'UPDATE monitored_sites SET last_check = NOW() WHERE id = ?',
                [siteId]
            );

            return result.insertId;
        } catch (error) {
            console.error('Error saving check result:', error);
            throw error;
        }
    }

    // Check if content has changed
    async detectChanges(siteId) {
        try {
            const [checks] = await pool.execute(
                'SELECT content_hash, created_at FROM site_checks WHERE site_id = ? ORDER BY created_at DESC LIMIT 2',
                [siteId]
            );

            if (checks.length < 2) {
                return { hasChanged: false, reason: 'Not enough data' };
            }

            const currentHash = checks[0].content_hash;
            const previousHash = checks[1].content_hash;

            if (currentHash !== previousHash) {
                return { 
                    hasChanged: true, 
                    reason: 'Content hash changed',
                    currentHash,
                    previousHash
                };
            }

            return { hasChanged: false, reason: 'No changes detected' };
        } catch (error) {
            console.error('Error detecting changes:', error);
            throw error;
        }
    }
}

module.exports = new WebsiteMonitor();
