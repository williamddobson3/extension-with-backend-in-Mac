#!/bin/bash
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
