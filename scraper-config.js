module.exports = {
    // Scraping settings
    scraping: {
        // Delays between requests (in milliseconds)
        delayBetweenSites: 2000,        // 2 seconds between sites
        delayBetweenMethods: 1000,      // 1 second between scraping methods
        
        // Timeouts
        axiosTimeout: 30000,            // 30 seconds for Axios
        puppeteerTimeout: 30000,        // 30 seconds for Puppeteer
        fallbackTimeout: 15000,         // 15 seconds for fallback
        
        // Puppeteer settings
        puppeteer: {
            headless: true,
            waitForContent: 2000,       // Wait 2 seconds for content to load
            viewport: { width: 1920, height: 1080 },
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
        }
    },
    
    // Content processing
    content: {
        // Text extraction
        maxTextPreview: 200,            // Characters to show in preview
        removeElements: [
            'script', 'style', 'noscript', 'iframe', 
            'img', 'svg', 'canvas', 'audio', 'video',
            'meta', 'link', 'title', 'head'
        ],
        
        // Text cleaning
        normalizeWhitespace: true,
        removeSpecialChars: false,      // Keep CJK and special characters
        preserveCJK: true               // Preserve Japanese, Chinese, Korean characters
    },
    
    // Change detection
    detection: {
        // Hash algorithm
        hashAlgorithm: 'md5',
        
        // Minimum content length to consider valid
        minContentLength: 10,
        
        // Keywords
        keywordCaseSensitive: false,
        keywordTrimWhitespace: true
    },
    
    // User agent strings for different browsers
    userAgents: {
        chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
    },
    
    // HTTP headers for different scraping methods
    headers: {
        axios: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        },
        fallback: {
            'Accept': '*/*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    },
    
    // Logging settings
    logging: {
        verbose: true,                  // Show detailed logs
        showTiming: true,               // Show response times
        showMethods: true,              // Show which scraping method was used
        showContentStats: true,         // Show content length and keyword stats
        showChangeDetails: true         // Show detailed change information
    },
    
    // Notification settings
    notifications: {
        enabled: true,                  // Enable notifications
        sendOnFirstCheck: false,        // Send notification on first check
        sendOnFailure: false,           // Send notification on scraping failure
        includeContentPreview: true,    // Include content preview in notifications
        includeMethodInfo: true         // Include scraping method info in notifications
    },
    
    // Database settings
    database: {
        saveFailedAttempts: true,       // Save failed scraping attempts
        saveContentPreview: true,       // Save content preview in database
        saveMethodInfo: true,           // Save which method was used
        maxRetries: 3                   // Maximum retries for failed scrapes
    }
};
