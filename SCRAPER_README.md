# 🌐 Website Scraper & Change Detector

A powerful, multi-method website scraping tool that can detect content changes and send notifications to users.

## ✨ Features

- **Multi-Method Scraping**: Automatically tries Axios, Puppeteer, and fallback methods
- **Smart Fallback**: If one method fails, automatically tries the next
- **Content Change Detection**: Compares content hashes and keyword presence
- **Automatic Notifications**: Sends email and LINE notifications when changes are detected
- **Database Integration**: Saves all scraping results and change history
- **Respectful Scraping**: Built-in delays and proper headers to avoid being blocked
- **Multi-Language Support**: Handles Japanese, Chinese, Korean, and other languages

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Make sure your `.env` file has the necessary database and email settings:
```env
# Database
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=website_monitor

# Email (for notifications)
EMAIL_HOST=142.250.185.109
EMAIL_PORT=465
EMAIL_USER=yuriilukianets9@gmail.com
EMAIL_PASS=daao qrql rxng xyjx

# Admin notifications
ADMIN_EMAIL=KM@sabosuku.com
ADMIN_NOTIFICATIONS_ENABLED=true
```

### 3. Run the Scraper
```bash
# Scrape all sites in database
node website-scraper.js

# Test the scraper
node test-scraper.js
```

## 🔧 How It Works

### Scraping Methods

1. **Axios (Fastest)**
   - Best for static HTML sites
   - Fastest response time
   - Good for news sites, blogs, documentation

2. **Puppeteer (Most Compatible)**
   - Handles JavaScript-heavy sites
   - Renders dynamic content
   - Good for SPAs, modern web apps

3. **Fallback (Most Reliable)**
   - Basic HTTP request
   - Accepts any response status
   - Good for problematic sites

### Change Detection

The scraper detects changes by comparing:

- **Content Hash**: MD5 hash of cleaned text content
- **Keyword Presence**: Whether specified keywords appear/disappear
- **Content Length**: Changes in overall content size

### Notification System

When changes are detected:
1. **Find all users** monitoring the site
2. **Send email notifications** to users with email enabled
3. **Send LINE notifications** to users with LINE enabled
4. **Log results** in the database

## 📊 Usage Examples

### Basic Scraping
```javascript
const WebsiteScraper = require('./website-scraper');

const scraper = new WebsiteScraper();

// Scrape a single site
const result = await scraper.scrapeAndDetectChanges(
    siteId, 
    'https://example.com', 
    'news,update,important'
);

// Scrape all sites in database
await scraper.scrapeAllSites();
```

### Custom Configuration
```javascript
const config = require('./scraper-config');

// Modify delays
config.scraping.delayBetweenSites = 5000; // 5 seconds

// Change timeouts
config.scraping.axiosTimeout = 60000; // 60 seconds

// Disable notifications
config.notifications.enabled = false;
```

## 🎯 Supported Website Types

### ✅ Well Supported
- **Static HTML sites** (news, blogs, documentation)
- **JavaScript-heavy sites** (React, Vue, Angular apps)
- **E-commerce sites** (product pages, catalogs)
- **News sites** (articles, headlines)
- **Corporate websites** (company info, press releases)

### ⚠️ May Require Configuration
- **Login-protected sites** (need authentication)
- **Rate-limited sites** (need longer delays)
- **Anti-bot sites** (may need proxy rotation)
- **Dynamic content sites** (may need custom selectors)

### ❌ Not Supported
- **Flash-based sites** (obsolete technology)
- **Sites requiring CAPTCHA**
- **Sites with strict bot detection**

## 📝 Configuration Options

### Scraping Settings
```javascript
scraping: {
    delayBetweenSites: 2000,        // Delay between sites (ms)
    delayBetweenMethods: 1000,      // Delay between methods (ms)
    axiosTimeout: 30000,            // Axios timeout (ms)
    puppeteerTimeout: 30000,        // Puppeteer timeout (ms)
    fallbackTimeout: 15000          // Fallback timeout (ms)
}
```

### Content Processing
```javascript
content: {
    maxTextPreview: 200,            // Max preview characters
    removeElements: ['script', 'style'], // Elements to remove
    normalizeWhitespace: true,      // Clean up whitespace
    preserveCJK: true               // Keep Asian characters
}
```

### Logging
```javascript
logging: {
    verbose: true,                  // Show detailed logs
    showTiming: true,               // Show response times
    showMethods: true,              // Show used methods
    showContentStats: true          // Show content statistics
}
```

## 🔍 Monitoring Specific Elements

### Keyword-Based Monitoring
```javascript
// Monitor for specific keywords
const keywords = 'breaking news,urgent,important';

// The scraper will detect when these keywords appear/disappear
```

### Content Change Monitoring
```javascript
// Monitor overall content changes
// Automatically detects when page content changes
// Uses MD5 hash comparison for accuracy
```

## 📧 Notification Types

### Email Notifications
- **Change detected**: Site content has changed
- **Keywords appeared**: New keywords found
- **Keywords disappeared**: Keywords no longer present
- **Site added/removed**: Admin notifications

### LINE Notifications
- **Text messages** with change details
- **Site information** and change reasons
- **Timestamps** of when changes were detected

## 🗄️ Database Schema

The scraper uses these tables:

### `site_checks`
- `id`: Unique identifier
- `site_id`: Reference to monitored site
- `content_hash`: MD5 hash of content
- `content_length`: Length of extracted text
- `status_code`: HTTP response status
- `response_time_ms`: Response time in milliseconds
- `changes_detected`: Whether keywords were found
- `created_at`: Timestamp of check

### `monitored_sites`
- `id`: Unique identifier
- `user_id`: User who owns the site
- `url`: Website URL
- `name`: Site name
- `keywords`: Keywords to monitor
- `check_interval_hours`: How often to check
- `last_check`: Last check timestamp

## 🚨 Error Handling

### Common Issues and Solutions

1. **Connection Timeout**
   - Increase timeout values in config
   - Check network connectivity
   - Try different scraping methods

2. **Content Extraction Failed**
   - Site may be blocking scrapers
   - Try using Puppeteer method
   - Check if site requires JavaScript

3. **Database Errors**
   - Verify database connection
   - Check table permissions
   - Ensure schema is correct

4. **Notification Failures**
   - Check email/LINE configuration
   - Verify user preferences
   - Check notification service status

## 🔒 Security Considerations

### Rate Limiting
- Built-in delays between requests
- Configurable delays per site
- Respects robots.txt (when possible)

### User Agent Rotation
- Multiple user agent strings
- Configurable headers
- Mimics real browser behavior

### Error Logging
- Detailed error information
- Failed attempt tracking
- Performance monitoring

## 📈 Performance Tips

### For Large Numbers of Sites
1. **Increase delays** between sites
2. **Use multiple instances** for different site groups
3. **Monitor database performance**
4. **Set appropriate check intervals**

### For Problematic Sites
1. **Use Puppeteer method** for JavaScript-heavy sites
2. **Increase timeouts** for slow sites
3. **Add custom headers** if needed
4. **Use proxy rotation** if blocked

## 🧪 Testing

### Run Tests
```bash
# Test basic functionality
node test-scraper.js

# Test complete notification flow
node test-complete-notification-flow.js

# Test admin notifications
node test-admin-notifications.js
```

### Test Specific Sites
```javascript
const scraper = new WebsiteScraper();

// Test a specific URL
const result = await scraper.smartScrape('https://example.com');
console.log('Result:', result);
```

## 📞 Support

### Common Questions

**Q: Why is my site not being scraped?**
A: Check if the site is active in the database, verify the URL is accessible, and check the logs for errors.

**Q: How do I add keywords to monitor?**
A: Update the `keywords` field in the `monitored_sites` table or use the web interface.

**Q: Can I monitor sites that require login?**
A: Currently not supported, but planned for future versions.

**Q: How often should I run the scraper?**
A: Depends on your needs. For news sites, every hour. For static sites, daily is sufficient.

## 🔮 Future Features

- **Login support** for protected sites
- **Proxy rotation** for anti-bot sites
- **Custom selectors** for specific elements
- **Scheduled scraping** with cron jobs
- **API endpoints** for external integration
- **Web dashboard** for monitoring results

## 📄 License

This project is part of the Website Monitor system. See the main README for license information.

---

**Happy Scraping! 🕷️✨**
