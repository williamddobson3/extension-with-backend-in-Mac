# Gmail API Setup Guide

## Overview
Since your corporate network blocks SMTP ports (25, 465, 587), we'll use Gmail API as an alternative method to send emails. This approach uses HTTP/HTTPS instead of SMTP, which should bypass network restrictions.

## Prerequisites
- Google account with Gmail
- 2-factor authentication enabled on your Google account
- Access to Google Cloud Console

## Step-by-Step Setup

### 1. Enable Gmail API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Desktop application" as application type
4. Give it a name (e.g., "Website Monitor Email Service")
5. Click "Create"
6. **Save the Client ID and Client Secret** - you'll need these

### 3. Generate Refresh Token
1. Download the OAuth 2.0 client configuration file
2. Use this script to generate a refresh token:

```bash
# Install required packages
npm install googleapis

# Run the token generator
node generate-gmail-token.js
```

### 4. Configure Environment Variables
Add these to your `.env` file:

```env
# Gmail API Configuration
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REFRESH_TOKEN=your_refresh_token_here

# Keep existing email config as fallback
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=yuriilukianets9@gmail.com
EMAIL_PASS=zjlouxtsmtxdlxfo
```

## Testing the Setup

### Test Gmail API Service
```bash
node test-gmail-api.js
```

### Test Email Sending
```bash
node test-email-sending.js
```

## Benefits of Gmail API vs SMTP

| Feature | SMTP | Gmail API |
|---------|------|-----------|
| **Network Access** | Requires ports 25/465/587 | Uses HTTPS (port 443) |
| **Corporate Firewalls** | Often blocked | Usually allowed |
| **Authentication** | Username/password | OAuth 2.0 (more secure) |
| **Rate Limits** | Gmail SMTP limits | Higher API limits |
| **Setup Complexity** | Simple | More complex initial setup |

## Troubleshooting

### Common Issues

1. **"Invalid Credentials" Error**
   - Verify your Client ID and Client Secret
   - Ensure the refresh token is correct
   - Check if 2FA is enabled on your Google account

2. **"API Not Enabled" Error**
   - Go to Google Cloud Console
   - Enable Gmail API for your project

3. **"Quota Exceeded" Error**
   - Gmail API has daily quotas
   - Check your usage in Google Cloud Console

### Network Issues
- Gmail API uses HTTPS (port 443) which is usually open
- If still blocked, contact your IT department
- Consider using a different network for testing

## Security Notes

- **Never commit credentials to version control**
- **Use environment variables for sensitive data**
- **Refresh tokens can be revoked if compromised**
- **Monitor API usage in Google Cloud Console**

## Alternative Solutions

If Gmail API doesn't work, consider:

1. **Webhook Services**: SendGrid, Mailgun, etc.
2. **HTTP Email Services**: Services that use HTTP instead of SMTP
3. **Corporate Email**: Use your company's email system
4. **Different Network**: Test from home or mobile hotspot

## Next Steps

1. Follow the setup guide above
2. Test the Gmail API service
3. Update your notification service to use Gmail API
4. Monitor email delivery success rates

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your Google Cloud Console settings
3. Test with the provided test scripts
4. Check your network/firewall settings
