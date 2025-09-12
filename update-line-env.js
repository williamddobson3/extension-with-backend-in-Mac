#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Updating LINE Configuration in .env file');
console.log('============================================\n');

console.log('📱 New LINE Credentials:');
console.log('   Channel ID: 2008063758');
console.log('   Channel Secret: 4fee6b1dafa8a2055c493481e53f7c1b');
console.log('   Access Token: [Updated]\n');

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

// Update LINE credentials
const updatedContent = envContent
    .replace('LINE_CHANNEL_ID=2007999524', 'LINE_CHANNEL_ID=2008063758')
    .replace('LINE_CHANNEL_ACCESS_TOKEN=wC2ad1cBncKnmQ+oQwAZEwkQA/mktCaAccMdFYK1HeYhpKwVohZrfGvEOeS4l1By3sSlo2dpw8EpI4GyXoQpunqB35GfV2Uc86PEXm7/tqnV4woeC29Rl/iMuzaKQHusZ9pPhY/6Xi/zOs+8fFnNjQdB04t89/1O/w1cDnyilFU=', 'LINE_CHANNEL_ACCESS_TOKEN=3ZR5PnTnCwRboI12SFPe9MPrkPsliNuUToFi091eyGslZ+W+Pg3sXE9Q+ZmfAosJ1qL0Kev9tXBIGYa7EJIJa2drgVjSOM7lv98K33R67QK6Hr43g6llGOx8ShJ2Afhotnh4QJDnN+b/MCKhMQB0bgdB04t89/1O/w1cDnyilFU=')
    .replace('LINE_CHANNEL_SECRET=21c0e68ea4b687bcd6f13f60485d69ce', 'LINE_CHANNEL_SECRET=4fee6b1dafa8a2055c493481e53f7c1b');

// Write updated content back to .env
try {
    fs.writeFileSync(envPath, updatedContent);
    console.log('✅ .env file updated with new LINE credentials!');
    console.log('\n🚀 Next steps:');
    console.log('1. Restart the server: npm start');
    console.log('2. Test LINE notifications');
    console.log('3. Set up LINE user ID in database');
    
    console.log('\n✨ LINE configuration updated successfully!');
    
} catch (error) {
    console.error('❌ Failed to update .env file:', error.message);
    console.log('\n📝 Manual fix required:');
    console.log('1. Edit the .env file manually');
    console.log('2. Update LINE credentials with new values');
    console.log('3. Save and restart the server');
}
