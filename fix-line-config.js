#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing LINE Configuration in .env file');
console.log('==========================================\n');

console.log('🚨 Problem Identified:');
console.log('   .env file contains placeholder LINE credentials');
console.log('   This causes 401 Unauthorized errors from LINE API\n');

console.log('💡 Solution: Update .env with real credentials from config.js\n');

// Read current .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

try {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Current .env file read successfully');
} catch (error) {
    console.error('❌ Failed to read .env file:', error.message);
    process.exit(1);
}

// Replace placeholder LINE credentials with real ones
const updatedContent = envContent
    .replace('LINE_CHANNEL_ID=your_line_channel_id', 'LINE_CHANNEL_ID=2007999524')
    .replace('LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token', 'LINE_CHANNEL_ACCESS_TOKEN=wC2ad1cBncKnmQ+oQwAZEwkQA/mktCaAccMdFYK1HeYhpKwVohZrfGvEOeS4l1By3sSlo2dpw8EpI4GyXoQpunqB35GfV2Uc86PEXm7/tqnV4woeC29Rl/iMuzaKQHusZ9pPhY/6Xi/zOs+8fFnNjQdB04t89/1O/w1cDnyilFU=')
    .replace('LINE_CHANNEL_SECRET=your_line_channel_secret', 'LINE_CHANNEL_SECRET=21c0e68ea4b687bcd6f13f60485d69ce');

// Write updated content back to .env
try {
    fs.writeFileSync(envPath, updatedContent);
    console.log('✅ .env file updated with correct LINE credentials!');
    console.log('\n📱 New LINE Configuration:');
    console.log('   Channel ID: 2007999524');
    console.log('   Access Token: [Configured]');
    console.log('   Channel Secret: [Configured]');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Restart the server: npm start');
    console.log('2. Test LINE notifications');
    console.log('3. LINE API should now work correctly!');
    
    console.log('\n✨ LINE configuration fix applied!');
    console.log('   This will resolve the 401 Unauthorized error');
    
} catch (error) {
    console.error('❌ Failed to update .env file:', error.message);
    console.log('\n📝 Manual fix required:');
    console.log('1. Edit the .env file manually');
    console.log('2. Replace placeholder values with real LINE credentials');
    console.log('3. Save and restart the server');
}
