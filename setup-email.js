#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📧 Email Configuration Setup');
console.log('============================\n');

console.log('Setting up Gmail configuration for KM@sabosuku.com...\n');

// Create .env content
const envContent = `# Database Configuration
DB_HOST=localhost
DB_USER=backend_user
DB_PASSWORD=cupideroskama200334!\`#QWE
DB_NAME=website_monitor
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret
JWT_SECRET=secret

# Email Configuration (Gmail) - Configured for KM@sabosuku.com
EMAIL_HOST=smtp.gmail.com
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

// Create .env file
try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully with Gmail configuration!');
    console.log('\n📧 Email Configuration:');
    console.log('   Host: smtp.gmail.com');
    console.log('   Port: 465');
    console.log('   User: KM@sabosuku.com');
    console.log('   Password: [Google App Password configured]');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Test email notifications using the test endpoint');
    console.log('3. Monitor websites will now send alerts to KM@sabosuku.com');
    
} catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
    console.log('\n📝 Manual setup required:');
    console.log('1. Create a .env file in the project root');
    console.log('2. Copy the configuration above into the .env file');
    console.log('3. Save the file and restart the server');
}

console.log('\n✨ Email setup complete!');
