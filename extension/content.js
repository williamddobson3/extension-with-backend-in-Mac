// Content script for Website Monitor extension

// Inject a button to quickly add the current page to monitoring
function injectQuickAddButton() {

    // Add Font Awesome if not present
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }

    // Create styles and button safely (avoid referencing undefined variables)
    const style = document.createElement('style');
    style.textContent = `
        #wm-quick-add-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 10000;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 6px 18px rgba(0,0,0,0.15);
            cursor: pointer;
        }
    `;

    const button = document.createElement('button');
    button.id = 'wm-quick-add-btn';
    button.title = 'Add page to Website Monitor';
    button.innerHTML = '<i class="fas fa-plus" aria-hidden="true"></i>';

    // Add to page (avoid duplicate injection)
    if (!document.getElementById('wm-quick-add-btn')) {
        try {
            document.head.appendChild(style);
            document.body.appendChild(button);
        } catch (e) {
            console.warn('Failed to inject quick add UI:', e);
            return;
        }
    }

    // Add click handler
    button.addEventListener('click', handleQuickAdd);
}

// Handle quick add button click
async function handleQuickAdd() {
    try {
        // Check if user is authenticated
        const hasToken = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'checkAuth' }, (response) => {
                resolve(response.hasToken);
            });
        });

        if (!hasToken) {
            showQuickAddMessage('ログインが必要です', 'error');
            return;
        }

        // Get current page info
        const pageInfo = {
            url: window.location.href,
            title: document.title,
            description: getPageDescription()
        };

        // Open popup with pre-filled data
        chrome.runtime.sendMessage({
            action: 'quickAdd',
            data: pageInfo
        });

        showQuickAddMessage('監視追加ダイアログを開きました', 'success');

    } catch (error) {
        console.error('Quick add error:', error);
        showQuickAddMessage('エラーが発生しました', 'error');
    }
}

// Get page description
function getPageDescription() {
    // Try to get meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.content) {
        return metaDesc.content;
    }

    // Try to get Open Graph description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && ogDesc.content) {
        return ogDesc.content;
    }

    // Fallback to first paragraph
    const firstP = document.querySelector('p');
    if (firstP && firstP.textContent) {
        return firstP.textContent.substring(0, 100) + '...';
    }

    return '';
}
// Show quick add message
function showQuickAddMessage(message, type = 'info') {
    // Remove existing message
    const existing = document.getElementById('wm-quick-add-message');
    if (existing) {
        existing.remove();
    }

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.id = 'wm-quick-add-message';
    messageEl.innerHTML = `
        <div class="wm-message ${type}">
            <span>${message}</span>
        </div>
    `;

    // Add message styles
    const style = document.createElement('style');
    style.textContent = `
        #wm-quick-add-message {
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .wm-message {
            background: white;
            color: #333;
            padding: 12px 16px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-size: 14px;
            max-width: 250px;
            animation: slideIn 0.3s ease;
        }
        
        .wm-message.success {
            border-left: 4px solid #28a745;
        }
        
        .wm-message.error {
            border-left: 4px solid #dc3545;
        }
        
        .wm-message.warning {
            border-left: 4px solid #ffc107;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;

    // Add to page
    document.head.appendChild(style);
    document.body.appendChild(messageEl);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 3000);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageInfo') {
        sendResponse({
            url: window.location.href,
            title: document.title,
            description: getPageDescription()
        });
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectQuickAddButton);
} else {
    injectQuickAddButton();
}

// Also inject when page changes (for SPA)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(injectQuickAddButton, 1000); // Wait for page to load
    }
}).observe(document, { subtree: true, childList: true });

