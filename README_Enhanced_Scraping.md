# Enhanced Website Scraping & Change Detection System

This enhanced system solves the problem of comparing previous scraped status with current scraped status by providing comprehensive data storage and advanced change detection capabilities.

## 🚨 Problems Solved

### Previous Issues:
- **Limited Data Storage**: Only basic information was stored (content_hash, status_code, response_time)
- **Insufficient Change Detection**: Only compared content hashes and keyword presence
- **No Historical Content**: Couldn't see what previous content looked like
- **No Detailed Comparison**: No way to compare specific elements or metrics

### New Solutions:
- **Comprehensive Data Storage**: Stores full content, metadata, error messages, and detailed status
- **Advanced Change Detection**: Compares content, status codes, response times, keywords, scraping methods, and error states
- **Historical Content Snapshots**: Saves full HTML and text content for detailed comparison
- **Detailed Change History**: Tracks all changes with severity levels and descriptions

## 🗄️ Enhanced Database Schema

### New Tables:

#### `scraped_content`
Stores content snapshots for detailed comparison:
- `content_type`: 'full_html', 'text_content', 'metadata'
- `content_data`: Actual content (LONGTEXT)
- `content_size`: Size of content

#### `change_history`
Tracks detailed change information:
- `change_type`: Type of change (content, status, performance, keywords, etc.)
- `change_description`: Human-readable description
- `old_value` / `new_value`: Previous and current values
- `severity`: low, medium, high, critical

### Enhanced Existing Tables:

#### `monitored_sites`
Added columns:
- `last_status_code`: Last HTTP status code
- `last_response_time_ms`: Last response time
- `last_scraping_method`: Last successful scraping method

#### `site_checks`
Added columns:
- `scraping_method`: Method used for scraping
- `change_type`: Types of changes detected
- `change_reason`: Human-readable change summary
- `keywords_found`: Whether keywords were found
- `keywords_list`: JSON array of found keywords
- `error_message`: Error details if scraping failed

## 🔧 Installation & Setup

### 1. Database Setup

```bash
# Create new database with enhanced schema
mysql -u root -p < database/enhanced_schema.sql

# OR migrate existing database
mysql -u root -p < database/migration.sql
```

### 2. Install Dependencies

```bash
npm install mysql2 puppeteer axios crypto
```

### 3. Configuration

Update your database configuration in your application:

```javascript
const dbConfig = {
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'website_monitor',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
```

## 🚀 Usage Examples

### Basic Scraping with Change Detection

```javascript
const EnhancedWebsiteScraper = require('./services/enhancedWebsiteScraper');

const scraper = new EnhancedWebsiteScraper(dbConfig);

// Scrape a site and detect changes
const result = await scraper.scrapeAndSaveStatus(
    1, // site ID
    'https://example.com', // URL
    'news,update,announcement' // keywords
);

console.log('Has Changes:', result.hasChanged);
console.log('Change Summary:', result.changeResult.summary);
console.log('Severity:', result.changeResult.severity);
```

### Get Change History

```javascript
// Get detailed change history
const changeHistory = await scraper.getChangeHistory(siteId, 10);

changeHistory.forEach(change => {
    console.log(`${change.detected_at}: ${change.change_description}`);
    console.log(`Severity: ${change.severity}`);
    console.log(`Old: ${change.old_value} -> New: ${change.new_value}`);
});
```

### Detailed Comparison Between Two Checks

```javascript
// Compare two specific checks
const comparison = await scraper.getDetailedComparison(checkId1, checkId2);

if (comparison.hasChanged) {
    console.log('Changes detected:');
    comparison.changeDetails.forEach(change => {
        console.log(`- ${change.type}: ${change.description}`);
        console.log(`  Severity: ${change.severity}`);
    });
}
```

### Batch Scraping Multiple Sites

```javascript
const sites = [
    { id: 1, url: 'https://site1.com', name: 'Site 1', keywords: 'news' },
    { id: 2, url: 'https://site2.com', name: 'Site 2', keywords: 'updates' }
];

const results = await scraper.batchScrapeSites(sites);

results.forEach(result => {
    if (result.hasChanged) {
        console.log(`${result.siteName}: Changes detected!`);
    }
});
```

## 📊 Change Detection Features

### Types of Changes Detected:

1. **Content Changes**: Website content has changed (based on content hash)
2. **Status Changes**: HTTP status code changed (200 → 404, etc.)
3. **Performance Changes**: Response time significantly changed (>50%)
4. **Keyword Changes**: Keywords appeared/disappeared or changed
5. **Method Changes**: Scraping method changed (puppeteer ↔ axios)
6. **Error Changes**: Site went from working to error state or vice versa

### Severity Levels:

- **Critical**: Site went down (200 → 4xx/5xx)
- **High**: Site recovered (4xx/5xx → 200) or major performance issues
- **Medium**: Content changes, keyword changes, method changes
- **Low**: Minor status code changes

## 🔍 Advanced Features

### Content Snapshots
- Full HTML content is saved for detailed comparison
- Text content is extracted and stored separately
- Content size tracking for performance analysis

### Change History Tracking
- Every change is logged with timestamp
- Detailed descriptions of what changed
- Severity-based filtering and alerting

### Performance Monitoring
- Response time tracking and analysis
- Performance degradation detection
- Scraping method optimization

### Error Handling
- Comprehensive error logging
- Error recovery tracking
- Failed scraping attempt history

## 📈 Monitoring & Analytics

### Change Pattern Analysis
```javascript
// Analyze change patterns over time
const patterns = await scraper.analyzeChangePatterns(siteId);
```

### Continuous Monitoring
```javascript
// Monitor a site every 5 minutes
await scraper.monitorSiteOverTime(siteId, url, keywords, 5);
```

## 🛠️ Migration from Old System

If you have an existing system, run the migration script:

```bash
mysql -u root -p < database/migration.sql
```

This will:
- Add new columns to existing tables
- Create new tables for enhanced functionality
- Preserve all existing data
- Add necessary indexes for performance

## 🔧 API Reference

### EnhancedWebsiteScraper Methods:

- `scrapeAndSaveStatus(siteId, url, keywords)` - Main scraping method
- `getScrapingHistory(siteId, limit)` - Get scraping history
- `getChangeHistory(siteId, limit)` - Get change history
- `getDetailedComparison(checkId1, checkId2)` - Compare two checks
- `batchScrapeSites(sites)` - Scrape multiple sites
- `monitorSiteOverTime(siteId, url, keywords, interval)` - Continuous monitoring

### EnhancedChangeDetector Methods:

- `detectChanges(siteId)` - Comprehensive change detection
- `getChangeHistory(siteId, limit)` - Get change history
- `getDetailedComparison(checkId1, checkId2)` - Detailed comparison

## 🎯 Benefits

1. **Complete Visibility**: See exactly what changed, when, and why
2. **Historical Data**: Access to all previous scraped content and status
3. **Smart Detection**: Intelligent change detection with severity levels
4. **Performance Monitoring**: Track response times and performance trends
5. **Error Tracking**: Comprehensive error logging and recovery tracking
6. **Scalable**: Efficient database design with proper indexing
7. **Flexible**: Support for multiple scraping methods and content types

## 🚀 Next Steps

1. Run the database migration
2. Update your existing scraping code to use the new `EnhancedWebsiteScraper`
3. Implement change detection using the new `EnhancedChangeDetector`
4. Set up monitoring and alerting based on change severity
5. Analyze change patterns to optimize monitoring intervals

This enhanced system provides complete visibility into website changes and gives you the tools to make informed decisions about when and how to respond to changes.
