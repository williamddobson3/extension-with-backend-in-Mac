@echo off
title Website Monitor - Easy Installer
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🚀 WEBSITE MONITOR                        ║
echo ║                      Easy Installer                          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo This installer will help you set up Website Monitor on your computer.
echo.
echo 📋 Prerequisites Check:
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is NOT installed
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org/
    echo 2. Download the LTS version
    echo 3. Run the installer
    echo 4. Restart this installer
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Node.js is installed
)

REM Check if MySQL is running
echo Checking MySQL connection...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MySQL is NOT accessible
    echo.
    echo Please make sure MySQL is installed and running:
    echo 1. Install MySQL from https://dev.mysql.com/downloads/installer/
    echo 2. Start MySQL service
    echo 3. Restart this installer
    echo.
    pause
    exit /b 1
) else (
    echo ✅ MySQL is accessible
)

echo.
echo 🎉 All prerequisites are met!
echo.
echo 🔧 Starting installation...
echo.

REM Install dependencies
echo 📦 Installing project dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully
echo.

REM Setup database
echo 🗄️ Setting up database...
call npm run setup
if %errorlevel% neq 0 (
    echo ❌ Failed to setup database
    echo.
    echo This might be due to:
    echo - MySQL not running
    echo - Wrong password in .env file
    echo - Database already exists
    echo.
    pause
    exit /b 1
)
echo ✅ Database setup completed
echo.

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🎉 INSTALLATION COMPLETE!                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ✅ Website Monitor has been installed successfully!
echo.
echo 📝 Next steps:
echo 1. Edit the .env file with your MySQL password
echo 2. Run start.bat to start the server
echo 3. Install the Chrome extension
echo.
echo 📖 For detailed instructions, see QUICK-START-GUIDE.md
echo.
echo 🚀 Ready to start monitoring websites!
echo.
pause
