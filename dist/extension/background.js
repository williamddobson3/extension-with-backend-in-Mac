// Background service worker for Website Monitor extension

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Website Monitor extension installed');
        
        // Open welcome page or show notification
        chrome.tabs.create({
            url: 'popup.html'
        });
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // This will open the popup automatically due to manifest configuration
    console.log('Extension icon clicked');
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);
    
    switch (request.action) {
        case 'getCurrentUrl':
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                sendResponse({ url: tabs[0].url });
            });
            return true; // Keep message channel open for async response
            
        case 'checkAuth':
            chrome.storage.local.get(['authToken'], (result) => {
                sendResponse({ hasToken: !!result.authToken });
            });
            return true;
            
        default:
            sendResponse({ error: 'Unknown action' });
    }
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.authToken) {
        console.log('Auth token changed:', changes.authToken.newValue ? 'set' : 'cleared');
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Website Monitor extension started');
});

// Handle extension update
chrome.runtime.onUpdateAvailable.addListener(() => {
    console.log('Extension update available');
    chrome.runtime.reload();
});
