console.log('Testing Node.js...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Test basic imports
try {
    const express = require('express');
    console.log('✅ Express loaded successfully');
} catch (error) {
    console.log('❌ Express error:', error.message);
}

try {
    const mysql = require('mysql2/promise');
    console.log('✅ MySQL2 loaded successfully');
} catch (error) {
    console.log('❌ MySQL2 error:', error.message);
}

console.log('Test completed!');
