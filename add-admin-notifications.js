#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Adding Admin Notification System');
console.log('==================================\n');

console.log('📧 Adding admin notification email configuration...\n');

// Read current .env file
const envPath = path.join(__dirname, '.env');
let currentEnv = '';
if (fs.existsSync(envPath)) {
    currentEnv = fs.readFileSync(envPath, 'utf8');
}

// Add admin notification configuration
const adminConfig = `
# Admin Notifications - Site management alerts
ADMIN_EMAIL=KM@sabosuku.com
ADMIN_NOTIFICATIONS_ENABLED=true
`;

// Append to existing .env file
const updatedEnv = currentEnv + adminConfig;

try {
    fs.writeFileSync(envPath, updatedEnv);
    console.log('✅ Admin notification configuration added!');
    console.log('\n📧 New Configuration:');
    console.log('   ADMIN_EMAIL: KM@sabosuku.com (change this to your desired email)');
    console.log('   ADMIN_NOTIFICATIONS_ENABLED: true');
    
    console.log('\n💡 Next steps:');
    console.log('1. Edit .env file and change ADMIN_EMAIL to your desired email');
    console.log('2. Restart the server to load new configuration');
    console.log('3. Admin notifications will be sent for site changes');
    
} catch (error) {
    console.error('❌ Failed to update .env file:', error.message);
}

console.log('\n✨ Admin notification system ready!');
console.log('   You\'ll receive emails when sites are added/removed');
