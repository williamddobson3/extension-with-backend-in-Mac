#!/usr/bin/env node

/**
 * Test script for the new 5-field registration system
 * Tests: ID, email, LINE, password, confirm password
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';

// Test data
const testUsers = [
    {
        name: 'Valid Registration',
        data: {
            username: 'testuser123',
            email: 'testuser123@example.com',
            password: 'password123',
            line_user_id: 'line123'
        },
        shouldSucceed: true
    },
    {
        name: 'Registration without LINE ID',
        data: {
            username: 'testuser456',
            email: 'testuser456@example.com',
            password: 'password456'
        },
        shouldSucceed: true
    },
    {
        name: 'Invalid User ID (special characters)',
        data: {
            username: 'test-user@#',
            email: 'testuser@example.com',
            password: 'password123'
        },
        shouldSucceed: false
    },
    {
        name: 'Invalid Email',
        data: {
            username: 'testuser789',
            email: 'invalid-email',
            password: 'password123'
        },
        shouldSucceed: false
    },
    {
        name: 'Short Password',
        data: {
            username: 'testuser999',
            email: 'testuser999@example.com',
            password: '123'
        },
        shouldSucceed: false
    }
];

async function testRegistration() {
    console.log('🧪 Testing New Registration System');
    console.log('====================================\n');

    let passed = 0;
    let failed = 0;

    for (const test of testUsers) {
        console.log(`🔍 Testing: ${test.name}`);
        console.log(`   Data: ${JSON.stringify(test.data)}`);
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(test.data)
            });

            const result = await response.json();
            
            if (test.shouldSucceed && result.success) {
                console.log('   ✅ PASS - Registration succeeded as expected');
                console.log(`   📝 User ID: ${result.user.username}`);
                console.log(`   📧 Email: ${result.user.email}`);
                console.log(`   📱 LINE ID: ${result.user.line_user_id || 'None'}`);
                passed++;
            } else if (!test.shouldSucceed && !result.success) {
                console.log('   ✅ PASS - Registration failed as expected');
                console.log(`   📝 Error: ${result.message}`);
                passed++;
            } else {
                console.log('   ❌ FAIL - Unexpected result');
                console.log(`   📝 Expected success: ${test.shouldSucceed}, Got: ${result.success}`);
                console.log(`   📝 Message: ${result.message}`);
                failed++;
            }
        } catch (error) {
            console.log('   ❌ FAIL - Network error');
            console.log(`   📝 Error: ${error.message}`);
            failed++;
        }
        
        console.log('');
    }

    console.log('📊 Test Results:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed! New registration system is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }
}

// Run tests
testRegistration().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});
