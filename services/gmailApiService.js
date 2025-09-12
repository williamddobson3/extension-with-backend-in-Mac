let google;
let googleApiAvailable = true;
try {
    ({ google } = require('googleapis'));
} catch (e) {
    googleApiAvailable = false;
    console.log('⚠️ googleapis module not installed. Gmail API fallback will be disabled.');
}
const nodemailer = require('nodemailer');

class GmailApiService {
    constructor() {
        this.auth = null;
        this.gmail = null;
        this.isConfigured = false;
    }

    // Initialize Gmail API authentication
    async initialize() {
        try {
            if (!googleApiAvailable) {
                return false;
            }
            // Check if we have the required environment variables
            const clientId = process.env.GMAIL_CLIENT_ID;
            const clientSecret = process.env.GMAIL_CLIENT_SECRET;
            const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
            const userEmail = process.env.EMAIL_USER || 'yuriilukianets9@gmail.com';

            if (!clientId || !clientSecret || !refreshToken) {
                console.log('⚠️ Gmail API credentials not configured');
                console.log('   Required: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN');
                return false;
            }

            // Create OAuth2 client
            this.auth = new google.auth.OAuth2(
                clientId,
                clientSecret,
                'urn:ietf:wg:oauth:2.0:oob' // Redirect URI for installed apps
            );

            // Set credentials
            this.auth.setCredentials({
                refresh_token: refreshToken
            });

            // Create Gmail API instance
            this.gmail = google.gmail({ version: 'v1', auth: this.auth });

            // Test authentication
            await this.testConnection();
            
            this.isConfigured = true;
            console.log('✅ Gmail API service initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Gmail API service:', error.message);
            return false;
        }
    }

    // Test Gmail API connection
    async testConnection() {
        try {
            const response = await this.gmail.users.getProfile({
                userId: 'me'
            });
            console.log(`✅ Gmail API connected for: ${response.data.emailAddress}`);
            return true;
        } catch (error) {
            throw new Error(`Gmail API connection failed: ${error.message}`);
        }
    }

    // Send email using Gmail API
    async sendEmail(to, subject, body, isHtml = false) {
        if (!this.isConfigured) {
            throw new Error('Gmail API service not initialized');
        }

        try {
            // Create email message
            const message = this.createMessage(to, subject, body, isHtml);
            
            // Send email
            const response = await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: message
                }
            });

            console.log('✅ Email sent successfully via Gmail API');
            console.log(`   Message ID: ${response.data.id}`);
            
            return {
                success: true,
                messageId: response.data.id,
                method: 'Gmail API'
            };

        } catch (error) {
            console.error('❌ Failed to send email via Gmail API:', error.message);
            throw error;
        }
    }

    // Create base64 encoded email message
    createMessage(to, subject, body, isHtml) {
        const email = [
            `To: ${to}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`,
            '',
            body
        ].join('\r\n');

        return Buffer.from(email).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    // Get service status
    getStatus() {
        return {
            configured: this.isConfigured,
            method: 'Gmail API',
            available: this.isConfigured && this.gmail !== null
        };
    }
}

module.exports = new GmailApiService();
