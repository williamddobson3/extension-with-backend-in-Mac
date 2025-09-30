// Background service worker for Website Monitor extension

const DEFAULT_API_BASE = 'https://your-api.example.com'; // replace with your backend or set via extension settings

// Helper to get API base from storage (allows per-user / per-environment override)
async function getApiBase() {
    return new Promise((resolve) => {
        try {
            chrome.storage.local.get(['apiBase'], (result) => {
                if (result && result.apiBase) resolve(result.apiBase);
                else resolve(DEFAULT_API_BASE);
            });
        } catch (e) {
            resolve(DEFAULT_API_BASE);
        }
    });
}

// Fetch the shared monitored sites from central DB
async function fetchMonitoredSitesFromServer(authToken = '') {
    const API_BASE = await getApiBase();
    const res = await fetch(`${API_BASE}/monitored_sites`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken ? `Bearer ${authToken}` : ''
        }
    });
    if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
    }
    return await res.json(); // expects [{ id, url, selector, last_snapshot, ... }, ...]
}

// Add a monitored site to server
async function addMonitoredSiteToServer(site, authToken = '') {
    const API_BASE = await getApiBase();
    const res = await fetch(`${API_BASE}/monitored_sites`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken ? `Bearer ${authToken}` : ''
        },
        body: JSON.stringify(site)
    });
    if (!res.ok) throw new Error('Failed to add site');
    return await res.json();
}

// When user signs-in or extension starts, sync remote -> local cache
async function syncSitesOnAuthChange(authToken = '') {
    try {
        const sites = await fetchMonitoredSitesFromServer(authToken);
        // store locally as cache for fast UI
        chrome.storage.local.set({ monitored_sites: sites }, () => {
            console.log('Monitored sites synced from server:', sites.length);
            // notify popup/UI to refresh if open
            chrome.runtime.sendMessage({ action: 'monitoredSitesUpdated', sites });
        });
    } catch (err) {
        console.error('Failed to sync sites from server:', err);
    }
}

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

// Trusted handler: create native notification from background (more reliable on macOS)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request && request.action === 'showNativeNotification') {
        try {
            const title = request.title || 'Website Monitor';
            const message = request.message || '';
            const iconUrl = request.icon || chrome.runtime.getURL('icons/icon128.png');
            if (chrome.notifications && typeof chrome.notifications.create === 'function') {
                chrome.notifications.create('', {
                    type: 'basic',
                    iconUrl,
                    title,
                    message
                }, (id) => {
                    console.log('Background created native notification', id);
                });
            }
        } catch (e) {
            console.warn('Failed to create background notification', e);
        }
        // respond quickly
        try { sendResponse({ ok: true }); } catch (e) {}
        return true;
    }
    // not handled here
});

// Listen to messages from popup/content
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        try {
            if (request.action === 'fetchSharedSites') {
                // optionally include auth token if you require auth. Example: get token from storage
                const { authToken } = await new Promise(res => chrome.storage.local.get('authToken', res));
                const sites = await fetchMonitoredSitesFromServer(authToken);
                sendResponse({ ok: true, sites });
            } else if (request.action === 'addSiteRemote') {
                const { site } = request;
                const { authToken } = await new Promise(res => chrome.storage.local.get('authToken', res));
                const created = await addMonitoredSiteToServer(site, authToken);
                // refresh cache
                await syncSitesOnAuthChange(authToken);
                sendResponse({ ok: true, created });
            } else if (request.action === 'onUserSignedIn') {
                // called when user signs in on any browser; trigger a sync
                const { authToken } = request;
                // persist token locally and sync
                chrome.storage.local.set({ authToken }, () => syncSitesOnAuthChange(authToken));
                sendResponse({ ok: true });
            } else {
                sendResponse({ ok: false, error: 'unknown action' });
            }
        } catch (err) {
            sendResponse({ ok: false, error: err.message });
        }
    })();
    // return true for async sendResponse
    return true;
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
