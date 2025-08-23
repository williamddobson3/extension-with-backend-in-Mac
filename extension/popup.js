// Global variables
let currentUser = null;
let authToken = null;
const API_BASE_URL = 'http://localhost:3001/api';

// DOM elements
const loadingEl = document.getElementById('loading');
const loginFormEl = document.getElementById('login-form');
const dashboardEl = document.getElementById('dashboard');

// Initialize the extension
document.addEventListener('DOMContentLoaded', async () => {
    await initializeExtension();
});

// Initialize extension
async function initializeExtension() {
    try {
        // Check if user is logged in
        const storedToken = await getStoredToken();
        if (storedToken) {
            // Verify token
            const isValid = await verifyToken(storedToken);
            if (isValid) {
                authToken = storedToken;
                currentUser = await getCurrentUser();
                showDashboard();
                loadSites();
                loadNotificationPreferences();
            } else {
                await clearStoredData();
                showLoginForm();
            }
        } else {
            showLoginForm();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showLoginForm();
    }
}

// Show login form
function showLoginForm() {
    loadingEl.style.display = 'none';
    loginFormEl.style.display = 'block';
    dashboardEl.style.display = 'none';
    setupLoginForm();
}

// Show dashboard
function showDashboard() {
    loadingEl.style.display = 'none';
    loginFormEl.style.display = 'none';
    dashboardEl.style.display = 'block';
    setupDashboard();
}

// Setup login form
function setupLoginForm() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Login form
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);

    // Register form
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', handleRegister);
}

// Setup dashboard
function setupDashboard() {
    // Update username
    if (currentUser) {
        document.getElementById('username').textContent = currentUser.username;
    }

    // Navigation tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update active nav tab
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Add site button
    document.getElementById('addSiteBtn').addEventListener('click', showAddSiteModal);

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Notification settings
    setupNotificationSettings();

    // Profile forms
    setupProfileForms();
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            await storeToken(authToken);
            showNotification('ログインに成功しました', 'success');
            showDashboard();
            loadSites();
            loadNotificationPreferences();
        } else {
            showNotification(data.message || 'ログインに失敗しました', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('ログインに失敗しました', 'error');
    }
}

// Handle register
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            await storeToken(authToken);
            showNotification('登録に成功しました', 'success');
            showDashboard();
            loadSites();
            loadNotificationPreferences();
        } else {
            showNotification(data.message || '登録に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showNotification('登録に失敗しました', 'error');
    }
}

// Handle logout
async function handleLogout() {
    await clearStoredData();
    authToken = null;
    currentUser = null;
    showLoginForm();
    showNotification('ログアウトしました', 'success');
}

// Load sites
async function loadSites() {
    try {
        const response = await fetch(`${API_BASE_URL}/sites`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            displaySites(data.sites);
        } else {
            showNotification('サイトの読み込みに失敗しました', 'error');
        }
    } catch (error) {
        console.error('Load sites error:', error);
        showNotification('サイトの読み込みに失敗しました', 'error');
    }
}

// Display sites
function displaySites(sites) {
    const sitesList = document.getElementById('sitesList');
    const noSites = document.getElementById('noSites');

    if (sites.length === 0) {
        sitesList.style.display = 'none';
        noSites.style.display = 'block';
        return;
    }

    sitesList.style.display = 'block';
    noSites.style.display = 'none';

    sitesList.innerHTML = sites.map(site => `
        <div class="site-card">
            <div class="site-header">
                <div>
                    <div class="site-name">${site.name}</div>
                    <a href="${site.url}" target="_blank" class="site-url">${site.url}</a>
                </div>
                <div class="site-actions">
                    <button class="btn-icon" onclick="editSite(${site.id})" title="編集">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteSite(${site.id})" title="削除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="site-status">
                <div class="status-indicator ${site.is_active ? '' : 'inactive'}"></div>
                <span>${site.is_active ? '監視中' : '停止中'}</span>
                <span>•</span>
                <span>${site.check_interval_hours}時間間隔</span>
            </div>
            <div class="site-info">
                <span>最終チェック: ${site.last_check ? new Date(site.last_check).toLocaleString('ja-JP') : '未チェック'}</span>
                <button class="btn-icon" onclick="manualCheck(${site.id})" title="手動チェック">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Show add site modal
function showAddSiteModal() {
    document.getElementById('addSiteModal').style.display = 'flex';
    document.getElementById('addSiteForm').addEventListener('submit', handleAddSite);
}

// Handle add site
async function handleAddSite(event) {
    event.preventDefault();
    
    const name = document.getElementById('siteName').value;
    const url = document.getElementById('siteUrl').value;
    const checkInterval = document.getElementById('checkInterval').value;
    const keywords = document.getElementById('keywords').value;

    try {
        const response = await fetch(`${API_BASE_URL}/sites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name,
                url,
                check_interval_hours: parseInt(checkInterval),
                keywords: keywords || null
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('サイトを追加しました', 'success');
            closeModal('addSiteModal');
            loadSites();
        } else {
            showNotification(data.message || 'サイトの追加に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Add site error:', error);
        showNotification('サイトの追加に失敗しました', 'error');
    }
}

// Edit site
async function editSite(siteId) {
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            const site = data.site;
            document.getElementById('editSiteId').value = site.id;
            document.getElementById('editSiteName').value = site.name;
            document.getElementById('editSiteUrl').value = site.url;
            document.getElementById('editCheckInterval').value = site.check_interval_hours;
            document.getElementById('editKeywords').value = site.keywords || '';
            document.getElementById('editSiteActive').checked = site.is_active;

            document.getElementById('editSiteModal').style.display = 'flex';
            document.getElementById('editSiteForm').addEventListener('submit', handleEditSite);
        }
    } catch (error) {
        console.error('Edit site error:', error);
        showNotification('サイト情報の取得に失敗しました', 'error');
    }
}

// Handle edit site
async function handleEditSite(event) {
    event.preventDefault();
    
    const siteId = document.getElementById('editSiteId').value;
    const name = document.getElementById('editSiteName').value;
    const url = document.getElementById('editSiteUrl').value;
    const checkInterval = document.getElementById('editCheckInterval').value;
    const keywords = document.getElementById('editKeywords').value;
    const isActive = document.getElementById('editSiteActive').checked;

    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name,
                url,
                check_interval_hours: parseInt(checkInterval),
                keywords: keywords || null,
                is_active: isActive
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('サイトを更新しました', 'success');
            closeModal('editSiteModal');
            loadSites();
        } else {
            showNotification(data.message || 'サイトの更新に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Edit site error:', error);
        showNotification('サイトの更新に失敗しました', 'error');
    }
}

// Delete site
async function deleteSite(siteId) {
    if (!confirm('このサイトを削除しますか？')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showNotification('サイトを削除しました', 'success');
            loadSites();
        } else {
            showNotification(data.message || 'サイトの削除に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Delete site error:', error);
        showNotification('サイトの削除に失敗しました', 'error');
    }
}

// Manual check
async function manualCheck(siteId) {
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/check`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showNotification('手動チェックを実行しました', 'success');
            loadSites();
        } else {
            showNotification(data.message || '手動チェックに失敗しました', 'error');
        }
    } catch (error) {
        console.error('Manual check error:', error);
        showNotification('手動チェックに失敗しました', 'error');
    }
}

// Setup notification settings
function setupNotificationSettings() {
    const emailEnabled = document.getElementById('emailEnabled');
    const lineEnabled = document.getElementById('lineEnabled');
    const lineConfig = document.getElementById('lineConfig');
    const lineUserId = document.getElementById('lineUserId');
    const testEmailBtn = document.getElementById('testEmailBtn');
    const testLineBtn = document.getElementById('testLineBtn');

    // Load preferences
    loadNotificationPreferences();

    // Email toggle
    emailEnabled.addEventListener('change', async () => {
        await updateNotificationPreferences({
            email_enabled: emailEnabled.checked
        });
    });

    // LINE toggle
    lineEnabled.addEventListener('change', async () => {
        lineConfig.style.display = lineEnabled.checked ? 'block' : 'none';
        await updateNotificationPreferences({
            line_enabled: lineEnabled.checked
        });
    });

    // LINE User ID
    lineUserId.addEventListener('blur', async () => {
        await updateNotificationPreferences({
            line_user_id: lineUserId.value
        });
    });

    // Test buttons
    testEmailBtn.addEventListener('click', testEmailNotification);
    testLineBtn.addEventListener('click', testLineNotification);
}

// Load notification preferences
async function loadNotificationPreferences() {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/preferences`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            const prefs = data.preferences;
            document.getElementById('emailEnabled').checked = prefs.email_enabled;
            document.getElementById('lineEnabled').checked = prefs.line_enabled;
            document.getElementById('lineUserId').value = prefs.line_user_id || '';
            document.getElementById('lineConfig').style.display = prefs.line_enabled ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Load preferences error:', error);
    }
}

// Update notification preferences
async function updateNotificationPreferences(preferences) {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/preferences`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(preferences)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('通知設定を更新しました', 'success');
        } else {
            showNotification(data.message || '通知設定の更新に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Update preferences error:', error);
        showNotification('通知設定の更新に失敗しました', 'error');
    }
}

// Test email notification
async function testEmailNotification() {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/test-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showNotification('テストメールを送信しました', 'success');
        } else {
            showNotification(data.message || 'テストメールの送信に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Test email error:', error);
        showNotification('テストメールの送信に失敗しました', 'error');
    }
}

// Test LINE notification
async function testLineNotification() {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/test-line`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showNotification('テストLINEメッセージを送信しました', 'success');
        } else {
            showNotification(data.message || 'テストLINEメッセージの送信に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Test LINE error:', error);
        showNotification('テストLINEメッセージの送信に失敗しました', 'error');
    }
}

// Setup profile forms
function setupProfileForms() {
    // Load profile data
    loadProfileData();

    // Profile form
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', handleUpdateProfile);

    // Password form
    const passwordForm = document.getElementById('passwordForm');
    passwordForm.addEventListener('submit', handleChangePassword);
}

// Load profile data
async function loadProfileData() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('profileEmail').value = data.user.email;
        }
    } catch (error) {
        console.error('Load profile error:', error);
    }
}

// Handle update profile
async function handleUpdateProfile(event) {
    event.preventDefault();
    
    const email = document.getElementById('profileEmail').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('プロフィールを更新しました', 'success');
        } else {
            showNotification(data.message || 'プロフィールの更新に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Update profile error:', error);
        showNotification('プロフィールの更新に失敗しました', 'error');
    }
}

// Handle change password
async function handleChangePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('パスワードを変更しました', 'success');
            document.getElementById('passwordForm').reset();
        } else {
            showNotification(data.message || 'パスワードの変更に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Change password error:', error);
        showNotification('パスワードの変更に失敗しました', 'error');
    }
}

// Utility functions
async function getStoredToken() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['authToken'], (result) => {
            resolve(result.authToken);
        });
    });
}

async function storeToken(token) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ authToken: token }, resolve);
    });
}

async function clearStoredData() {
    return new Promise((resolve) => {
        chrome.storage.local.clear(resolve);
    });
}

async function verifyToken(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        return false;
    }
}

async function getCurrentUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        return data.success ? data.user : null;
    } catch (error) {
        return null;
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const icon = document.getElementById('notificationIcon');
    const messageEl = document.getElementById('notificationMessage');

    // Set icon based on type
    switch (type) {
        case 'success':
            icon.className = 'fas fa-check-circle';
            notification.className = 'notification success';
            break;
        case 'error':
            icon.className = 'fas fa-exclamation-circle';
            notification.className = 'notification error';
            break;
        case 'warning':
            icon.className = 'fas fa-exclamation-triangle';
            notification.className = 'notification warning';
            break;
        default:
            icon.className = 'fas fa-info-circle';
            notification.className = 'notification';
    }

    messageEl.textContent = message;
    notification.style.display = 'block';

    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Global functions for onclick handlers
window.showAddSiteModal = showAddSiteModal;
window.closeModal = closeModal;
