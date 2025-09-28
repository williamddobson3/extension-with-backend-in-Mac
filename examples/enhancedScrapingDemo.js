const EnhancedWebsiteScraper = require('./services/enhancedWebsiteScraper');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'website_monitor',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Initialize the enhanced scraper
const scraper = new EnhancedWebsiteScraper(dbConfig);

/**
 * Example usage of the enhanced scraping system
 */
async function demonstrateEnhancedScraping() {
    try {
        console.log('🚀 Starting Enhanced Website Scraping Demo\n');

        // Example 1: Scrape a single site
        console.log('📋 Example 1: Scraping a single site');
        const result1 = await scraper.scrapeAndSaveStatus(
            1, // site ID
            'https://example.com', // URL
            'news,update,announcement' // keywords to search for
        );

        console.log('Result:', JSON.stringify(result1, null, 2));
        console.log('\n' + '='.repeat(80) + '\n');

        // Example 2: Get scraping history
        console.log('📋 Example 2: Getting scraping history');
        const history = await scraper.getScrapingHistory(1, 5);
        console.log('Scraping History:', JSON.stringify(history, null, 2));
        console.log('\n' + '='.repeat(80) + '\n');

        // Example 3: Get change history
        console.log('📋 Example 3: Getting change history');
        const changeHistory = await scraper.getChangeHistory(1, 5);
        console.log('Change History:', JSON.stringify(changeHistory, null, 2));
        console.log('\n' + '='.repeat(80) + '\n');

        // Example 4: Batch scraping multiple sites
        console.log('📋 Example 4: Batch scraping multiple sites');
        const sites = [
            { id: 1, url: 'https://example.com', name: 'Example Site', keywords: 'news,update' },
            { id: 2, url: 'https://httpbin.org', name: 'HTTP Bin', keywords: null },
            { id: 3, url: 'https://jsonplaceholder.typicode.com', name: 'JSON Placeholder', keywords: 'api,json' }
        ];

        const batchResults = await scraper.batchScrapeSites(sites);
        console.log('Batch Results:', JSON.stringify(batchResults, null, 2));
        console.log('\n' + '='.repeat(80) + '\n');

        // Example 5: Detailed comparison between two checks
        console.log('📋 Example 5: Detailed comparison between two checks');
        if (history.length >= 2) {
            const comparison = await scraper.getDetailedComparison(
                history[1].id, // previous check
                history[0].id  // current check
            );
            console.log('Detailed Comparison:', JSON.stringify(comparison, null, 2));
        }

        console.log('\n✅ Demo completed successfully!');

    } catch (error) {
        console.error('❌ Demo failed:', error);
    }
}

/**
 * Example of monitoring a site over time
 */
async function monitorSiteOverTime(siteId, url, keywords, intervalMinutes = 5) {
    console.log(`🔄 Starting continuous monitoring for site ${siteId}`);
    console.log(`   URL: ${url}`);
    console.log(`   Keywords: ${keywords || 'None'}`);
    console.log(`   Interval: ${intervalMinutes} minutes\n`);

    let iteration = 1;
    
    const monitorInterval = setInterval(async () => {
        try {
            console.log(`\n📊 Monitoring iteration ${iteration++}`);
            console.log(`⏰ Time: ${new Date().toLocaleString()}`);
            
            const result = await scraper.scrapeAndSaveStatus(siteId, url, keywords);
            
            if (result.hasChanged) {
                console.log(`🔔 CHANGE DETECTED!`);
                console.log(`   Summary: ${result.changeResult.summary}`);
                console.log(`   Severity: ${result.changeResult.severity}`);
                console.log(`   Change Types: ${result.changeResult.changeTypes.join(', ')}`);
                
                // Here you could trigger notifications, alerts, etc.
            } else {
                console.log(`✅ No changes detected`);
            }
            
        } catch (error) {
            console.error(`❌ Monitoring error:`, error);
        }
    }, intervalMinutes * 60 * 1000);

    // Stop monitoring after 1 hour (for demo purposes)
    setTimeout(() => {
        clearInterval(monitorInterval);
        console.log('\n🛑 Monitoring stopped');
    }, 60 * 60 * 1000);
}

/**
 * Example of analyzing change patterns
 */
async function analyzeChangePatterns(siteId) {
    try {
        console.log(`📈 Analyzing change patterns for site ${siteId}`);
        
        const changeHistory = await scraper.getChangeHistory(siteId, 50);
        
        if (changeHistory.length === 0) {
            console.log('No change history available');
            return;
        }

        // Analyze change types
        const changeTypes = {};
        const severities = {};
        const timePatterns = {};

        changeHistory.forEach(change => {
            // Count change types
            changeTypes[change.change_type] = (changeTypes[change.change_type] || 0) + 1;
            
            // Count severities
            severities[change.severity] = (severities[change.severity] || 0) + 1;
            
            // Analyze time patterns
            const hour = new Date(change.detected_at).getHours();
            timePatterns[hour] = (timePatterns[hour] || 0) + 1;
        });

        console.log('\n📊 Change Analysis Results:');
        console.log('Change Types:', changeTypes);
        console.log('Severities:', severities);
        console.log('Time Patterns (by hour):', timePatterns);

        // Find most active hours
        const mostActiveHour = Object.keys(timePatterns).reduce((a, b) => 
            timePatterns[a] > timePatterns[b] ? a : b
        );
        console.log(`Most active hour: ${mostActiveHour}:00`);

    } catch (error) {
        console.error('❌ Error analyzing change patterns:', error);
    }
}

// Export functions for use in other modules
module.exports = {
    demonstrateEnhancedScraping,
    monitorSiteOverTime,
    analyzeChangePatterns
};

// Run demo if this file is executed directly
if (require.main === module) {
    demonstrateEnhancedScraping()
        .then(() => {
            console.log('\n🎉 Demo completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Demo failed:', error);
            process.exit(1);
        });
}
