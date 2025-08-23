# Website Monitor - Chrome Extension

A comprehensive website monitoring solution with Chrome extension, backend server, and database. Monitor website changes and receive notifications via email or LINE.

## 🌟 Features

### Core Functionality
- **Multi-site Monitoring**: Monitor multiple websites simultaneously
- **Flexible Check Intervals**: Set check intervals from 1 hour to 1 week
- **Keyword Detection**: Monitor for specific keywords (e.g., "製造終了", "新商品")
- **Change Detection**: Advanced content change detection using hash comparison
- **24/7 Monitoring**: Backend server runs continuously, even when browser is closed

### Notification System
- **Email Notifications**: Beautiful HTML email notifications
- **LINE Notifications**: Direct LINE messaging (requires LINE Messaging API)
- **Test Notifications**: Test both email and LINE notifications
- **Notification History**: Track all sent notifications

### User Management
- **User Registration/Login**: Secure authentication system
- **Profile Management**: Update email and password
- **Community Distribution**: Admin can control user access
- **User Preferences**: Individual notification settings

### Chrome Extension
- **Beautiful UI**: Modern, responsive design
- **Quick Add**: Add current page to monitoring with one click
- **Real-time Status**: View monitoring status and last check times
- **Manual Checks**: Trigger immediate website checks
- **Site Management**: Add, edit, delete monitored sites

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chrome        │    │   Backend       │    │   Database      │
│   Extension     │◄──►│   Server        │◄──►│   (MySQL)       │
│                 │    │   (Node.js)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Content       │    │   Scheduler     │    │   Users         │
│   Script        │    │   Service       │    │   Table         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   Website       │    │   Monitored     │
         │              │   Monitor       │    │   Sites         │
         │              │   Service       │    │   Table         │
         │              └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   Notification  │    │   Notifications │
         │              │   Service       │    │   Table         │
         │              └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Quick Add     │    │   Email &       │
│   Button        │    │   LINE APIs     │
└─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Chrome browser

### 1. Database Setup

```sql
-- Create database and tables
mysql -u root -p < database/schema.sql
```

### 2. Backend Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env with your configuration
nano .env
```

Configure your `.env` file:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=website_monitor
DB_PORT=3306

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
```

### 3. Start Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 4. Install Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder
5. The extension icon should appear in your toolbar

### 5. First Use

1. Click the extension icon
2. Register a new account
3. Add your first website to monitor
4. Configure notification preferences
5. Test notifications

## 📁 Project Structure

```
extension5/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── sites.js
│   │   └── notifications.js
│   ├── services/
│   │   ├── websiteMonitor.js
│   │   ├── notificationService.js
│   │   └── schedulerService.js
│   ├── database/
│   │   └── schema.sql
│   ├── package.json
│   ├── server.js
│   └── env.example
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── background.js
│   └── content.js
└── README.md
```

## 🔧 Configuration

### Email Setup (Gmail)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `EMAIL_PASS`

### LINE Setup

1. Create a LINE Bot:
   - Go to [LINE Developers Console](https://developers.line.biz/)
   - Create a new provider and channel
   - Get Channel Access Token and Channel Secret
2. Add the bot to your LINE account
3. Get your LINE User ID (you can use LINE's official user ID getter)
4. Configure in `.env` file

### Database Configuration

The system supports MySQL with the following tables:
- `users`: User accounts and authentication
- `monitored_sites`: Websites being monitored
- `site_checks`: History of website checks
- `notifications`: Notification history
- `user_notifications`: User notification preferences

## 🎯 Usage Examples

### Monitor Product Discontinuation Pages

```javascript
// Example sites to monitor
const sites = [
    {
        name: "小林製薬 廃盤情報",
        url: "https://www.kobayashi.co.jp/seihin/end/",
        keywords: "製造終了,廃盤,終了"
    },
    {
        name: "花王 廃盤商品",
        url: "https://www.kao-kirei.com/ja/expire-item/kbb/",
        keywords: "製造終了,廃盤,終了"
    },
    {
        name: "ライオン 廃盤商品",
        url: "https://www.lion.co.jp/ja/products/end.php",
        keywords: "製造終了,廃盤,終了"
    }
];
```

### Monitor News Sites

```javascript
const newsSites = [
    {
        name: "P&G ニュース",
        url: "https://jp.pg.com/newsroom/",
        keywords: "リニューアル,新登場,製造終了,新商品"
    }
];
```

## 🔍 Monitoring Features

### Content Change Detection
- **Hash-based**: Generates MD5 hash of page content
- **Text Extraction**: Removes scripts and styles for clean comparison
- **Keyword Monitoring**: Detects specific keywords in content
- **Response Time**: Tracks website performance

### Advanced Scraping
- **Dual Method**: Uses Axios for simple sites, Puppeteer for JavaScript-heavy sites
- **User Agent**: Mimics real browser behavior
- **Error Handling**: Graceful fallback between methods
- **Rate Limiting**: Respects website resources

### Notification System
- **Rich Email**: Beautiful HTML templates with site information
- **LINE Integration**: Direct messaging via LINE Messaging API
- **Delivery Tracking**: Logs all notification attempts
- **Test Functionality**: Verify notification setup

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 rounds
- **Rate Limiting**: Prevents abuse
- **CORS Protection**: Secure cross-origin requests
- **Input Validation**: Comprehensive validation on all inputs
- **SQL Injection Protection**: Parameterized queries

## 📊 Performance

### Monitoring Performance
- **Concurrent Checks**: Processes multiple sites simultaneously
- **Intelligent Scheduling**: Respects check intervals
- **Resource Management**: Delays between requests to avoid overwhelming servers
- **Error Recovery**: Continues monitoring even if some sites fail

### Extension Performance
- **Lightweight**: Minimal impact on browser performance
- **Efficient Storage**: Uses Chrome storage API
- **Background Processing**: Service worker handles background tasks
- **Memory Management**: Proper cleanup of resources

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **Email Notifications Not Working**
   - Verify Gmail app password
   - Check 2FA is enabled
   - Test SMTP settings

3. **LINE Notifications Not Working**
   - Verify Channel Access Token
   - Check LINE User ID is correct
   - Ensure bot is added to your account

4. **Extension Not Loading**
   - Check manifest.json syntax
   - Verify all files are present
   - Check Chrome console for errors

### Debug Mode

Enable debug logging:
```bash
NODE_ENV=development DEBUG=* npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the troubleshooting section
2. Review the code comments
3. Open an issue on GitHub

## 🔮 Future Enhancements

- [ ] Web dashboard for admin management
- [ ] Slack/Discord notifications
- [ ] Advanced keyword filtering
- [ ] Visual change detection (screenshots)
- [ ] Mobile app companion
- [ ] API rate limiting per user
- [ ] Bulk site import/export
- [ ] Advanced scheduling (specific times)
- [ ] Multi-language support
- [ ] Analytics dashboard

---

**Made with ❤️ for the Japanese community**
