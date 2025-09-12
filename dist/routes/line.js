const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const { pool } = require('../config/database');
const router = express.Router();

// LINE webhook signature verification
const verifyLineSignature = (req, res, next) => {
    const signature = req.headers['x-line-signature'];
    if (!signature) {
        return res.status(401).json({ error: 'No signature provided' });
    }

    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    const body = JSON.stringify(req.body);
    const hash = crypto.createHmac('SHA256', channelSecret).update(body).digest('base64');

    if (signature !== hash) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
};

// LINE webhook endpoint
router.post('/webhook', verifyLineSignature, async (req, res) => {
    try {
        const events = req.body.events;
        
        for (const event of events) {
            if (event.type === 'message' && event.message.type === 'text') {
                await handleLineMessage(event);
            } else if (event.type === 'follow') {
                await handleLineFollow(event);
            } else if (event.type === 'unfollow') {
                await handleLineUnfollow(event);
            }
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('LINE webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Handle incoming LINE messages
async function handleLineMessage(event) {
    const { replyToken, message, source } = event;
    const lineUserId = source.userId;
    const userMessage = message.text.toLowerCase();

    try {
        // Check if user exists
        const [users] = await pool.execute(
            'SELECT id, username FROM users WHERE line_user_id = ?',
            [lineUserId]
        );

        if (users.length === 0) {
            // User not found, send welcome message
            await replyToLine(replyToken, 
                '👋 Welcome to Website Monitor!\n\n' +
                'To get started, please:\n' +
                '1. Log in to your account at our website\n' +
                '2. Go to your profile settings\n' +
                '3. Add your LINE User ID: ' + lineUserId + '\n\n' +
                'After that, you\'ll receive website update notifications here!'
            );
            return;
        }

        const user = users[0];

        // Handle commands
        if (userMessage === 'help' || userMessage === 'h') {
            await replyToLine(replyToken,
                '🔧 Available Commands:\n\n' +
                '📊 status - Check your monitored sites\n' +
                '📝 help - Show this help message\n' +
                '🔔 test - Send a test notification\n' +
                '❌ stop - Disable LINE notifications\n' +
                '✅ start - Enable LINE notifications'
            );
        } else if (userMessage === 'status' || userMessage === 's') {
            await sendSiteStatus(replyToken, user.id);
        } else if (userMessage === 'test') {
            await sendTestNotification(replyToken, user.id);
        } else if (userMessage === 'stop') {
            await updateLineNotifications(user.id, false);
            await replyToLine(replyToken, '🔕 LINE notifications have been disabled.');
        } else if (userMessage === 'start') {
            await updateLineNotifications(user.id, true);
            await replyToLine(replyToken, '🔔 LINE notifications have been enabled.');
        } else {
            await replyToLine(replyToken,
                '🤔 I didn\'t understand that command.\n' +
                'Type "help" to see available commands.'
            );
        }

    } catch (error) {
        console.error('Error handling LINE message:', error);
        await replyToLine(replyToken, '❌ Sorry, something went wrong. Please try again later.');
    }
}

// Handle LINE follow event
async function handleLineFollow(event) {
    const lineUserId = event.source.userId;
    
    try {
        // Get user profile from LINE
        const profile = await getLineUserProfile(lineUserId);
        
        await replyToLine(event.replyToken,
            `👋 Hi ${profile.displayName}!\n\n` +
            'Welcome to Website Monitor!\n\n' +
            'To get started:\n' +
            '1. Log in to your account at our website\n' +
            '2. Go to your profile settings\n' +
            '3. Add your LINE User ID: ' + lineUserId + '\n\n' +
            'After that, you\'ll receive website update notifications here!\n\n' +
            'Type "help" to see available commands.'
        );
    } catch (error) {
        console.error('Error handling LINE follow:', error);
    }
}

// Handle LINE unfollow event
async function handleLineUnfollow(event) {
    const lineUserId = event.source.userId;
    
    try {
        // Disable LINE notifications for this user
        await pool.execute(
            'UPDATE user_notifications SET line_enabled = false WHERE line_user_id = ?',
            [lineUserId]
        );
        
        console.log(`User ${lineUserId} unfollowed, LINE notifications disabled`);
    } catch (error) {
        console.error('Error handling LINE unfollow:', error);
    }
}

// Reply to LINE message
async function replyToLine(replyToken, message) {
    try {
        const response = await axios.post(
            'https://api.line.me/v2/bot/message/reply',
            {
                replyToken: replyToken,
                messages: [{ type: 'text', text: message }]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
                }
            }
        );
        
        return response.data;
    } catch (error) {
        console.error('Error replying to LINE:', error);
        throw error;
    }
}

// Get LINE user profile
async function getLineUserProfile(lineUserId) {
    try {
        const response = await axios.get(
            `https://api.line.me/v2/bot/profile/${lineUserId}`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
                }
            }
        );
        
        return response.data;
    } catch (error) {
        console.error('Error getting LINE user profile:', error);
        return { displayName: 'User' };
    }
}

// Send site status to user
async function sendSiteStatus(replyToken, userId) {
    try {
        const [sites] = await pool.execute(
            `SELECT name, url, last_check, is_active 
             FROM monitored_sites 
             WHERE user_id = ? AND is_active = true`,
            [userId]
        );

        if (sites.length === 0) {
            await replyToLine(replyToken, '📊 You don\'t have any monitored sites yet.');
            return;
        }

        let message = '📊 Your Monitored Sites:\n\n';
        for (const site of sites) {
            const lastCheck = site.last_check ? 
                new Date(site.last_check).toLocaleString() : 'Never';
            const status = site.is_active ? '✅' : '❌';
            
            message += `${status} ${site.name}\n`;
            message += `🌐 ${site.url}\n`;
            message += `🕒 Last check: ${lastCheck}\n\n`;
        }

        await replyToLine(replyToken, message);
    } catch (error) {
        console.error('Error sending site status:', error);
        await replyToLine(replyToken, '❌ Error getting site status. Please try again.');
    }
}

// Send test notification
async function sendTestNotification(replyToken, userId) {
    try {
        const [users] = await pool.execute(
            'SELECT username FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            await replyToLine(replyToken, '❌ User not found.');
            return;
        }

        const testMessage = `🔔 Test Notification\n\n` +
            `Hello ${users[0].username}!\n` +
            `This is a test message to verify your LINE notifications are working.\n\n` +
            `✅ If you received this, everything is set up correctly!`;

        await replyToLine(replyToken, testMessage);
    } catch (error) {
        console.error('Error sending test notification:', error);
        await replyToLine(replyToken, '❌ Error sending test notification. Please try again.');
    }
}

// Update LINE notification settings
async function updateLineNotifications(userId, enabled) {
    try {
        await pool.execute(
            'UPDATE user_notifications SET line_enabled = ? WHERE user_id = ?',
            [enabled, userId]
        );
    } catch (error) {
        console.error('Error updating LINE notifications:', error);
        throw error;
    }
}

// Get LINE login URL for user authentication
router.get('/login-url', (req, res) => {
    const channelId = process.env.LINE_CHANNEL_ID;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/line/callback`;
    const state = crypto.randomBytes(16).toString('hex');
    
    const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
        `response_type=code&` +
        `client_id=${channelId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `scope=profile%20openid`;

    res.json({
        success: true,
        loginUrl: loginUrl,
        state: state
    });
});

// LINE OAuth callback
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
        return res.status(400).json({ error: 'Authorization code not provided' });
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://api.line.me/oauth2/v2.1/token', {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: `${req.protocol}://${req.get('host')}/api/line/callback`,
            client_id: process.env.LINE_CHANNEL_ID,
            client_secret: process.env.LINE_CHANNEL_SECRET
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, id_token } = tokenResponse.data;

        // Get user profile
        const profileResponse = await axios.get('https://api.line.me/v2/profile', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        const profile = profileResponse.data;

        res.json({
            success: true,
            message: 'LINE authentication successful',
            profile: {
                userId: profile.userId,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl
            }
        });

    } catch (error) {
        console.error('LINE OAuth error:', error);
        res.status(500).json({ error: 'LINE authentication failed' });
    }
});

module.exports = router;
