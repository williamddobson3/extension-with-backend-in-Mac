# 🚀 Website Monitor - Quick Start Guide for Users

## 📦 What You Just Downloaded

This is a complete website monitoring system that includes:
- ✅ Backend server (runs on your computer)
- ✅ Chrome extension (adds to your browser)
- ✅ Database (stores your monitored sites)
- ✅ Everything needed to monitor websites 24/7

## 🎯 What It Does

- **Monitor multiple websites** for changes
- **Get notified** via email when websites change
- **Track specific keywords** (like "new product", "discontinued")
- **Works 24/7** even when your browser is closed

## 🚀 Quick Start (Windows Users)

### Step 1: Install Prerequisites
1. **Install Node.js**: Download from https://nodejs.org/ (LTS version)
2. **Install MySQL**: Download from https://dev.mysql.com/downloads/installer/
3. **Make sure Chrome browser** is installed

### Step 2: First Time Setup
1. **Double-click setup.bat** - this will install everything
2. **Edit the .env file** with your MySQL password
3. **Double-click start.bat** - this starts the server

### Step 3: Install Chrome Extension
1. Open Chrome and go to chrome://extensions/
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the extension folder from this project
5. The extension icon will appear in your toolbar

### Step 4: Start Using
1. Click the extension icon
2. Login with demo account: demo@example.com / password123
3. Add your first website to monitor
4. Set up email notifications

## 🚀 Quick Start (Mac/Linux Users)

### Step 1: Install Prerequisites
1. **Install Node.js**: Download from https://nodejs.org/ (LTS version)
2. **Install MySQL**: Use your package manager or download from mysql.com
3. **Make sure Chrome browser** is installed

### Step 2: First Time Setup
1. **Run ./setup.sh** in terminal - this will install everything
2. **Edit the .env file** with your MySQL password
3. **Run ./start.sh** - this starts the server

### Step 3: Install Chrome Extension
1. Open Chrome and go to chrome://extensions/
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the extension folder from this project
5. The extension icon will appear in your toolbar

### Step 4: Start Using
1. Click the extension icon
2. Login with demo account: demo@example.com / password123
3. Add your first website to monitor
4. Set up email notifications

## 🔧 Configuration

### Database Settings (.env file)
```
DB_HOST=localhost
DB_USER=backend_user
DB_PASSWORD=your_mysql_password_here
DB_NAME=website_monitor
DB_PORT=3306
```

### Email Settings (Optional)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 📱 How to Use

1. **Add Websites**: Click "Add New Site" in the extension
2. **Set Check Intervals**: Choose how often to check (1 hour to 1 week)
3. **Add Keywords**: Monitor for specific words (optional)
4. **Get Notifications**: Receive email alerts when changes are detected

## 🆘 Troubleshooting

### "Database Connection Failed"
- Make sure MySQL is running
- Check your password in the .env file
- Verify MySQL is accessible

### "Port Already in Use"
- Change the port in your .env file (e.g., from 3000 to 3000)

### Extension Not Loading
- Make sure you enabled Developer mode
- Check that all files are in the extension folder
- Try reloading the extension

## 📞 Support

- Check the README.md for detailed technical information
- Look at the console logs for error messages
- Make sure all prerequisites are installed correctly

## 🎉 You're All Set!

Once everything is running:
- The server will monitor your websites 24/7
- You'll get email notifications when changes are detected
- You can manage everything through the Chrome extension
- Your monitoring continues even when the browser is closed

Happy monitoring! 🚀
