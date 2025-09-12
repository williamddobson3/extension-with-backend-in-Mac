const websiteMonitor = require('./services/websiteMonitor');

// Test element-specific monitoring
async function testElementMonitoring() {
    try {
        console.log('🔍 Testing Element-Specific Monitoring');
        console.log('=====================================');
        
        // The specific element text you want to monitor
        const targetElementText = 'Fullscreen your browser and click Start in the magnifying glass.';
        
        console.log(`🎯 Target Element: "${targetElementText}"`);
        console.log('');
        
        // Example: Check if this element exists in some content
        const testContent = `
            <html>
                <body>
                    <p>Welcome to our website!</p>
                    <p>Fullscreen your browser and click Start in the magnifying glass.</p>
                    <p>Thank you for visiting.</p>
                </body>
            </html>
        `;
        
        console.log('📝 Testing with content that contains the target element...');
        const elementFound = websiteMonitor.checkSpecificElement(testContent, targetElementText);
        console.log(`✅ Element found: ${elementFound}`);
        console.log('');
        
        // Example: Test with content that doesn't contain the element
        const testContent2 = `
            <html>
                <body>
                    <p>Welcome to our website!</p>
                    <p>This is different content.</p>
                    <p>Thank you for visiting.</p>
                </body>
            </html>
        `;
        
        console.log('📝 Testing with content that does NOT contain the target element...');
        const elementFound2 = websiteMonitor.checkSpecificElement(testContent2, targetElementText);
        console.log(`❌ Element found: ${elementFound2}`);
        console.log('');
        
        console.log('🚀 Element monitoring is ready!');
        console.log('');
        console.log('To use this in production:');
        console.log('1. Run the SQL migration: add-text-content-column.sql');
        console.log('2. Add a site with the target element text as "keywords"');
        console.log('3. The system will now detect when this specific element changes!');
        
    } catch (error) {
        console.error('❌ Error testing element monitoring:', error);
    }
}

// Run the test
testElementMonitoring();
