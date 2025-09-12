#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Email Configuration');
console.log('==============================\n');

console.log('📧 Current Issue:');
console.log('   EMAIL_HOST is set to smtp.gmail.com which resolves to local IP');
console.log('   Need to use direct Gmail IP address for reliable connection\n');

// Read current .env file
const envPath = path.join(__dirname, '.env');
let currentEnv = '';
if (fs.existsSync(envPath)) {
    currentEnv = fs.readFileSync(envPath, 'utf8');
}

// Replace EMAIL_HOST with direct IP
const updatedEnv = currentEnv.replace(
    'EMAIL_HOST=smtp.gmail.com',
    'EMAIL_HOST=142.250.185.109'
);

try {
    fs.writeFileSync(envPath, updatedEnv);
    console.log('✅ Email configuration fixed!');
    console.log('\n📧 New Configuration:');
    console.log('   EMAIL_HOST: 142.250.185.109 (Gmail direct IP)');
    console.log('   EMAIL_PORT: 465 (SSL)');
    console.log('   EMAIL_USER: yuriilukianets9@gmail.com');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Restart the server: npm start');
    console.log('2. Test admin notifications: node test-admin-notifications.js');
    console.log('3. Admin notifications should now work properly!');
    
} catch (error) {
    console.error('❌ Failed to update .env file:', error.message);
}

console.log('\n✨ Email configuration updated!');
console.log('   Using direct IP address for reliable Gmail connection');
