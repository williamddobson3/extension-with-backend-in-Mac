# Installation Guide

## Prerequisites

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **MySQL** (v8.0 or higher)
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or use XAMPP/WAMP for Windows
   - Verify installation: `mysql --version`

3. **Chrome Browser**
   - Latest version recommended

## Step-by-Step Installation

### 1. Clone/Download the Project

```bash
# If using git
git clone <repository-url>
cd extension5

# Or download and extract the ZIP file
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your settings
nano .env  # or use any text editor
```

**Required .env configuration:**
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=website_monitor
DB_PORT=3306

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret (change this!)
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# Email Configuration (optional for testing)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# LINE Messaging API (optional for testing)
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
```

### 4. Setup Database

```bash
# Run the setup script
npm run setup
```

This will:
- Create the database and tables
- Create a demo user account
- Add sample monitored sites

### 5. Start the Backend Server

```bash
# Development mode (with auto-restart)
npm run dev

# Or production mode
npm start
```

You should see:
```
🚀 Server running on port 3001
📊 Environment: development
🔗 Health check: http://localhost:3001/health
✅ Database connected successfully
🚀 Starting website monitoring scheduler...
✅ Scheduler started successfully
```

### 6. Install Chrome Extension

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `extension` folder from this project
6. The extension icon should appear in your toolbar

### 7. Test the Installation

1. Click the extension icon in Chrome
2. Login with demo account:
   - Email: `demo@example.com`
   - Password: `password123`
3. You should see the dashboard with sample sites

## Troubleshooting

### Database Connection Issues

```bash
# Check if MySQL is running
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # macOS
# For Windows, check Services app

# Test MySQL connection
mysql -u root -p
```

### Port Already in Use

```bash
# Check what's using port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill the process or change port in .env
```

### Extension Not Loading

1. Check Chrome console for errors
2. Verify all files are in the extension folder
3. Check manifest.json syntax
4. Try reloading the extension

### Email Notifications Not Working

1. Enable 2FA on Gmail
2. Generate App Password
3. Use App Password in EMAIL_PASS
4. Test with the test button in extension

## Quick Test

After installation, you can test the system:

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Manual Site Check:**
   - Open extension
   - Click on a site
   - Click the refresh button to manually check

3. **Test Notifications:**
   - Go to Notifications tab
   - Click "Test Email" or "Test LINE"

## Production Deployment

For production use:

1. Change JWT_SECRET to a strong random string
2. Set NODE_ENV=production
3. Use a proper database (not localhost)
4. Set up proper email service
5. Configure LINE Messaging API
6. Use HTTPS for the backend
7. Set up proper hosting (AWS, GCP, etc.)

## Support

If you encounter issues:

1. Check the console logs
2. Verify all prerequisites are installed
3. Check the troubleshooting section in README.md
4. Ensure all environment variables are set correctly

---

**Happy Monitoring! 🚀**
