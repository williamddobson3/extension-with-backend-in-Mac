# LINE Messaging API Integration Setup Guide

## 🎯 What's Been Set Up

Your project now has full LINE messaging API integration! Here's what's been implemented:

### ✅ Completed Setup
1. **LINE Routes** (`routes/line.js`)
   - Webhook endpoint for receiving LINE messages
   - OAuth authentication for users
   - Interactive bot commands
   - Signature verification for security

2. **Updated Services**
   - `notificationService.js` now includes Channel ID
   - LINE notification sending functionality
   - Database integration for LINE user IDs

3. **Server Integration**
   - LINE routes added to `server.js`
   - Webhook endpoint: `/api/line/webhook`

## 🔧 Manual Configuration Required

### Step 1: Create .env File
Create a `.env` file in your project root with these LINE credentials:

```bash
# LINE Messaging API
LINE_CHANNEL_ID=2007999524
LINE_CHANNEL_ACCESS_TOKEN=wC2ad1cBncKnmQ+oQwAZEwkQA/mktCaAccMdFYK1HeYhpKwVohZrfGvEOeS4l1By3sSlo2dpw8EpI4GyXoQpunqB35GfV2Uc86PEXm7/tqnV4woeC29Rl/iMuzaKQHusZ9pPhY/6Xi/zOs+8fFnNjQdB04t89/1O/w1cDnyilFU=
LINE_CHANNEL_SECRET=21c0e68ea4b687bcd6f13f60485d69ce
```

**Also include your existing environment variables:**
- Database configuration
- Server configuration  
- Email configuration
- Rate limiting settings

### Step 2: LINE Developer Console Configuration

1. **Go to [LINE Developers Console](https://developers.line.biz/)**
2. **Select your channel** (ID: 2007999524)
3. **Configure Webhook:**
   - Webhook URL: `http://your-domain.com/api/line/webhook`
   - Enable "Use webhook" option
   - Verify webhook signature is working

4. **Messaging API Settings:**
   - Ensure your channel is in "Messaging API" mode
   - Copy your Channel ID, Channel Secret, and Access Token

## 🚀 Testing Your Integration

### Start Your Server
```bash
npm start
# or
node server.js
```

### Test LINE API Connection
```bash
node setup-line.js
```

### Test Webhook (when server is running)
1. Send a message to your LINE bot
2. Check server logs for webhook events
3. Verify bot responses

## 📱 LINE Bot Features

### User Commands
- **`help`** - Show available commands
- **`status`** - Check monitored sites
- **`test`** - Send test notification
- **`start`** - Enable LINE notifications
- **`stop`** - Disable LINE notifications

### Automatic Notifications
- Website update alerts
- Site status changes
- Monitoring results

## 🔐 Security Features

- **Webhook signature verification** using HMAC-SHA256
- **OAuth 2.0** for user authentication
- **Rate limiting** on API endpoints
- **Environment variable** protection for credentials

## 🌐 Webhook URL Configuration

Your webhook URL will be:
```
http://your-domain.com/api/line/webhook
```

**For local development:**
```
http://localhost:3003/api/line/webhook
```

**For production:**
- Use your actual domain
- Ensure HTTPS is enabled
- Configure LINE Developer Console accordingly

## 📊 Database Schema

The following tables support LINE integration:
- `users.line_user_id` - Stores LINE User ID
- `user_notifications.line_enabled` - LINE notification preferences
- `notifications.type` - Tracks LINE vs email notifications

## 🚨 Troubleshooting

### Common Issues

1. **Webhook not receiving messages:**
   - Check server is running
   - Verify webhook URL in LINE Console
   - Check server logs for errors

2. **Signature verification failed:**
   - Ensure LINE_CHANNEL_SECRET is correct
   - Check webhook signature in request headers

3. **Bot not responding:**
   - Verify LINE_CHANNEL_ACCESS_TOKEN
   - Check server logs for API errors
   - Ensure user has LINE User ID configured

### Debug Commands
```bash
# Check server status
curl http://localhost:3003/health

# Test LINE webhook (when server running)
curl -X POST http://localhost:3003/api/line/webhook \
  -H "Content-Type: application/json" \
  -d '{"events":[{"type":"message","message":{"type":"text","text":"test"},"source":{"userId":"test"}}]}'
```

## 🎉 Next Steps

1. **Create your .env file** with the credentials above
2. **Start your server** and test the connection
3. **Configure LINE Developer Console** webhook URL
4. **Test with a real LINE account** by sending messages
5. **Monitor server logs** for webhook events

## 📞 Support

If you encounter issues:
1. Check server logs for error messages
2. Verify all environment variables are set
3. Test LINE API connection separately
4. Ensure webhook URL is accessible from LINE servers

---

**Your LINE integration is ready to go! 🚀**
