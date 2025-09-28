# Fix .env file script
# This script will create a new .env file with the correct email configuration

Write-Host "🔧 Fixing .env file..." -ForegroundColor Yellow

# Create new .env content
$envContent = @"
# Database Configuration   
DB_HOST=localhost
DB_USER=root
DB_NAME=website_monitor    
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret
JWT_SECRET=secret

# Email Configuration (Gmail) - Using direct IP to bypass DNS issues
EMAIL_HOST=142.250.185.109
EMAIL_PORT=465
EMAIL_USER=KM@sabosuku.com
EMAIL_PASS=hzpw wojd xszu ladn

# LINE Messaging API
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
"@

# Write to .env file
$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host "📧 Email configuration updated:" -ForegroundColor Cyan
Write-Host "   Host: 142.250.185.109 (direct Gmail IP)" -ForegroundColor White
    Write-Host "   Port: 465 (SSL, not TLS)" -ForegroundColor White
Write-Host "   User: KM@sabosuku.com" -ForegroundColor White

Write-Host "`n🚀 Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your server: npm start" -ForegroundColor White
Write-Host "2. Try the 'Maker Test' button again" -ForegroundColor White
Write-Host "3. Check the console for email configuration logs" -ForegroundColor White
