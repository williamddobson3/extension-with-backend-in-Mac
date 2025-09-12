@echo off
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
