const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building distribution package for end users...');

// Create distribution directory
const distDir = 'dist';
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir);

// Copy project files
const filesToCopy = [
    'package.json',
    'package-lock.json',
    'server.js',
    'setup.js',
    'demo-setup.js',
    'scraper.py',
    'requirements.txt',
    'env.example',
    'README.md',
    'INSTALL.md',
    'PROJECT_SUMMARY.md'
];

const dirsToCopy = [
    'config',
    'middleware',
    'routes',
    'services',
    'database',
    'extension'
];

console.log('📁 Copying project files...');

// Copy individual files
filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(distDir, file));
        console.log(`✅ Copied ${file}`);
    }
});

// Copy directories
dirsToCopy.forEach(dir => {
    if (fs.existsSync(dir)) {
        copyDir(dir, path.join(distDir, dir));
        console.log(`✅ Copied ${dir}/`);
    }
});

// Create user-friendly startup scripts
createStartupScripts(distDir);

// Create user guide
createUserGuide(distDir);

console.log('\n🎉 Distribution package created successfully!');
console.log('📦 Users can now download the "dist" folder and run it');

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

function createStartupScripts(distDir) {
    // Windows batch file
    const windowsBatch = `@echo off
echo 🚀 Starting Website Monitor...
echo.
echo 📋 Prerequisites:
echo   1. Make sure you have Node.js installed (https://nodejs.org/)
echo   2. Make sure you have MySQL installed and running
echo   3. Make sure you have Chrome browser installed
echo.
echo 🔧 First time setup:
echo   1. Run "setup.bat" to set up the database
echo   2. Edit the .env file with your database settings
echo   3. Run "start.bat" to start the server
echo.
echo 📖 For detailed instructions, see README.md
echo.
pause
`;
    
    fs.writeFileSync(path.join(distDir, 'README-FOR-USERS.txt'), windowsBatch);
    
    // Windows setup script
    const setupBatch = `@echo off
echo 🔧 Setting up Website Monitor for first time use...
echo.
echo 📦 Installing dependencies...
call npm install
echo.
echo 🗄️ Setting up database...
call npm run setup
echo.
echo ✅ Setup complete! 
echo 📝 Now edit the .env file with your database settings
echo 🚀 Then run start.bat to start the server
echo.
pause
`;
    
    fs.writeFileSync(path.join(distDir, 'setup.bat'), setupBatch);
    
    // Windows start script
    const startBatch = `@echo off
echo 🚀 Starting Website Monitor Server...
echo.
echo 📍 Server will be available at: http://localhost:3000
echo 🌐 Chrome extension will connect to this server
echo.
echo ⚠️  Keep this window open while using the extension
echo.
call npm start
pause
`;
    
    fs.writeFileSync(path.join(distDir, 'start.bat'), startBatch);
    
    // Linux/Mac startup script
    const linuxScript = `#!/bin/bash
echo "🚀 Starting Website Monitor..."
echo ""
echo "📋 Prerequisites:"
echo "  1. Make sure you have Node.js installed (https://nodejs.org/)"
echo "  2. Make sure you have MySQL installed and running"
echo "  3. Make sure you have Chrome browser installed"
echo ""
echo "🔧 First time setup:"
echo "  1. Run './setup.sh' to set up the database"
echo "  2. Edit the .env file with your database settings"
echo "  3. Run './start.sh' to start the server"
echo ""
echo "📖 For detailed instructions, see README.md"
echo ""
read -p "Press Enter to continue..."
`;
    
    fs.writeFileSync(path.join(distDir, 'README-FOR-USERS.sh'), linuxScript);
    
    // Linux/Mac setup script
    const linuxSetup = `#!/bin/bash
echo "🔧 Setting up Website Monitor for first time use..."
echo ""
echo "📦 Installing dependencies..."
npm install
echo ""
echo "🗄️ Setting up database..."
npm run setup
echo ""
echo "✅ Setup complete!"
echo "📝 Now edit the .env file with your database settings"
echo "🚀 Then run ./start.sh to start the server"
echo ""
read -p "Press Enter to continue..."
`;
    
    fs.writeFileSync(path.join(distDir, 'setup.sh'), linuxSetup);
    
    // Linux/Mac start script
    const linuxStart = `#!/bin/bash
echo "🚀 Starting Website Monitor Server..."
echo ""
echo "📍 Server will be available at: http://localhost:3000"
echo "🌐 Chrome extension will connect to this server"
echo ""
echo "⚠️  Keep this terminal open while using the extension"
echo ""
npm start
`;
    
    fs.writeFileSync(path.join(distDir, 'start.sh'), linuxStart);
    
    // Make shell scripts executable (for Linux/Mac)
    try {
        execSync(`chmod +x ${path.join(distDir, '*.sh')}`);
    } catch (e) {
        // Windows doesn't have chmod, that's okay
    }
}

function createUserGuide(distDir) {
    const userGuide = `# 🚀 Website Monitor - Quick Start Guide for Users

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
\`\`\`
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=website_monitor
DB_PORT=3306
\`\`\`

### Email Settings (Optional)
\`\`\`
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
\`\`\`

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
`;

    fs.writeFileSync(path.join(distDir, 'QUICK-START-GUIDE.md'), userGuide);
}

console.log('\n📋 Distribution package includes:');
console.log('✅ All project files and dependencies');
console.log('✅ Windows batch files (setup.bat, start.bat)');
console.log('✅ Linux/Mac shell scripts (setup.sh, start.sh)');
console.log('✅ User-friendly README and guides');
console.log('✅ Everything needed to run the system');
console.log('\n📦 Users can now:');
console.log('1. Download the "dist" folder');
console.log('2. Run setup.bat/setup.sh for first time');
console.log('3. Run start.bat/start.sh to start the server');
console.log('4. Install the Chrome extension');
console.log('5. Start monitoring websites!');
