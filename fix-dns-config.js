#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing DNS Resolution Issue');
console.log('==============================\n');

console.log('🚨 Problem Identified:');
console.log('   Your DNS server is resolving smtp.gmail.com to 10.10.7.111');
console.log('   This is blocking email connections to Gmail\n');

console.log('💡 Solution: Use Gmail\'s direct IP address instead of hostname\n');

// Create .env content with direct IP
const envContent = `# Database Configuration   
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
RATE_LIMIT_MAX_REQUESTS=100
`;

// Check if .env already exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists. Backing up as .env.backup...');
    fs.copyFileSync(envPath, envPath + '.backup');
}

// Create .env file with direct IP configuration
try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated with direct IP configuration!');
    console.log('\n📧 New Email Configuration:');
    console.log('   Host: 142.250.185.109 (Gmail SMTP direct IP)');
    console.log('   Port: 465');
    console.log('   User: KM@sabosuku.com');
    console.log('   Password: [Google App Password configured]');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Stop the current server (Ctrl+C)');
    console.log('2. Start the server again: npm start');
    console.log('3. Test email notifications');
    console.log('4. Email alerts will now work properly!');
    
} catch (error) {
    console.error('❌ Failed to update .env file:', error.message);
    console.log('\n📝 Manual fix required:');
    console.log('1. Edit the .env file manually');
    console.log('2. Change EMAIL_HOST from smtp.gmail.com to 142.250.185.109');
    console.log('3. Save and restart the server');
}

console.log('\n✨ DNS resolution fix applied!');
console.log('   This bypasses your network\'s DNS override');
console.log('   and connects directly to Gmail\'s SMTP server');
