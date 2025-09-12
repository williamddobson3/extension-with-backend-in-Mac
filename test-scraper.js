#!/usr/bin/env node

require('dotenv').config();
const WebsiteScraper = require('./website-scraper');

console.log('🧪 Testing Website Scraper');
console.log('==========================\n');

async function testScraper() {
    const scraper = new WebsiteScraper();
    
    try {
        // Test 1: Test a simple website
        console.log('🔍 Test 1: Testing simple website scraping...');
        const testUrl = 'https://httpbin.org/html';
        
        const result = await scraper.smartScrape(testUrl);
        
        if (result.success) {
            console.log('✅ Simple website scraping successful!');
            console.log(`   Method: ${result.method}`);
            console.log(`   Status: ${result.statusCode}`);
            console.log(`   Time: ${result.responseTime}ms`);
            console.log(`   Content length: ${result.content.length} characters`);
        } else {
            console.log('❌ Simple website scraping failed:', result.error);
        }
        
        // Test 2: Test content extraction
        if (result.success) {
            console.log('\n🔍 Test 2: Testing content extraction...');
            const textContent = scraper.extractTextContent(result.content, result.method);
            console.log(`✅ Content extraction successful!`);
            console.log(`   Extracted text length: ${textContent.length} characters`);
            console.log(`   Preview: ${textContent.substring(0, 100)}...`);
            
            // Test 3: Test hash generation
            console.log('\n🔍 Test 3: Testing hash generation...');
            const hash = scraper.generateHash(textContent);
            console.log(`✅ Hash generation successful!`);
            console.log(`   Hash: ${hash}`);
            
            // Test 4: Test keyword detection
            console.log('\n🔍 Test 4: Testing keyword detection...');
            const keywords = 'html,head,body';
            const keywordResult = scraper.checkKeywords(textContent, keywords);
            console.log(`✅ Keyword detection successful!`);
            console.log(`   Keywords found: ${keywordResult.found}`);
            console.log(`   Found keywords: ${keywordResult.keywords.join(', ')}`);
            console.log(`   Total keywords: ${keywordResult.total}`);
        }
        
        // Test 5: Test database operations
        console.log('\n🔍 Test 5: Testing database operations...');
        try {
            const { pool } = require('./config/database');
            await pool.execute('SELECT 1');
            console.log('✅ Database connection successful!');
            
            // Test saving a scraping result
            const testSiteId = 999; // Use a test ID
            const testHash = 'test_hash_' + Date.now();
            const testKeywords = { found: true, keywords: ['test'], total: 1 };
            
            await scraper.saveScrapingResult(
                testSiteId, 
                testHash, 
                100, 
                200, 
                500, 
                testKeywords, 
                'test'
            );
            console.log('✅ Database save operation successful!');
            
            // Clean up test data
            await pool.execute('DELETE FROM site_checks WHERE site_id = ?', [testSiteId]);
            console.log('✅ Test data cleaned up!');
            
        } catch (dbError) {
            console.log('❌ Database test failed:', dbError.message);
        }
        
        console.log('\n🎉 All tests completed!');
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await scraper.closeBrowser();
    }
}

// Run the test
testScraper();
