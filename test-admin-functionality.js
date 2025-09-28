const fetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3003/api';

async function testAdminFunctionality() {
    console.log('🧪 Testing Admin Functionality...\n');

    try {
        // Test 1: Register admin user
        console.log('1️⃣ Testing admin user registration...');
        const adminRegisterResponse = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin_test',
                email: 'KM@sabosuku.com',
                password: 'testpass123'
            })
        });

        const adminRegisterData = await adminRegisterResponse.json();
        if (adminRegisterData.success) {
            console.log('✅ Admin user registered successfully');
            console.log(`   - User ID: ${adminRegisterData.user.id}`);
            console.log(`   - Is Admin: ${adminRegisterData.user.is_admin}`);
        } else {
            console.log('❌ Admin registration failed:', adminRegisterData.message);
        }

        // Test 2: Register regular user
        console.log('\n2️⃣ Testing regular user registration...');
        const userRegisterResponse = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'regular_user',
                email: 'regular@example.com',
                password: 'testpass123'
            })
        });

        const userRegisterData = await userRegisterResponse.json();
        if (userRegisterData.success) {
            console.log('✅ Regular user registered successfully');
            console.log(`   - User ID: ${userRegisterData.user.id}`);
            console.log(`   - Is Admin: ${userRegisterData.user.is_admin}`);
        } else {
            console.log('❌ Regular user registration failed:', userRegisterData.message);
        }

        // Test 3: Login as admin
        console.log('\n3️⃣ Testing admin login...');
        const adminLoginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin_test',
                password: 'testpass123'
            })
        });

        const adminLoginData = await adminLoginResponse.json();
        if (adminLoginData.success) {
            console.log('✅ Admin login successful');
            console.log(`   - Is Admin: ${adminLoginData.user.is_admin}`);
            
            const adminToken = adminLoginData.token;

            // Test 4: Get all users (admin only)
            console.log('\n4️⃣ Testing get all users (admin)...');
            const usersResponse = await fetch(`${API_BASE_URL}/users`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            const usersData = await usersResponse.json();
            if (usersData.success) {
                console.log('✅ Users retrieved successfully');
                console.log(`   - Total users: ${usersData.users.length}`);
                usersData.users.forEach(user => {
                    console.log(`   - ${user.username} (${user.email}) - Admin: ${user.is_admin} - Active: ${user.is_active}`);
                });
            } else {
                console.log('❌ Failed to get users:', usersData.message);
            }

            // Test 5: Toggle user status
            if (usersData.success && usersData.users.length > 1) {
                const regularUser = usersData.users.find(u => !u.is_admin);
                if (regularUser) {
                    console.log('\n5️⃣ Testing toggle user status...');
                    const toggleResponse = await fetch(`${API_BASE_URL}/users/${regularUser.id}/toggle-active`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${adminToken}` }
                    });

                    const toggleData = await toggleResponse.json();
                    if (toggleData.success) {
                        console.log('✅ User status toggled successfully');
                        console.log(`   - New status: ${toggleData.is_active ? 'Active' : 'Inactive'}`);
                    } else {
                        console.log('❌ Failed to toggle user status:', toggleData.message);
                    }
                }
            }

            // Test 6: Delete user
            if (usersData.success && usersData.users.length > 1) {
                const regularUser = usersData.users.find(u => !u.is_admin);
                if (regularUser) {
                    console.log('\n6️⃣ Testing delete user...');
                    const deleteResponse = await fetch(`${API_BASE_URL}/users/${regularUser.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${adminToken}` }
                    });

                    const deleteData = await deleteResponse.json();
                    if (deleteData.success) {
                        console.log('✅ ユーザーが正常に削除されました');
                    } else {
                        console.log('❌ ユーザーを削除できませんでした:', deleteData.message);
                    }
                }
            }

        } else {
            console.log('❌ Admin login failed:', adminLoginData.message);
        }

        // Test 7: Test regular user trying to access admin functions
        console.log('\n7️⃣ Testing regular user access to admin functions...');
        const regularLoginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'regular_user',
                password: 'testpass123'
            })
        });

        const regularLoginData = await regularLoginResponse.json();
        if (regularLoginData.success) {
            const regularToken = regularLoginData.token;
            
            const regularUsersResponse = await fetch(`${API_BASE_URL}/users`, {
                headers: { 'Authorization': `Bearer ${regularToken}` }
            });

            if (regularUsersResponse.status === 403) {
                console.log('✅ Regular user correctly blocked from admin functions');
            } else {
                console.log('❌ Regular user should not have access to admin functions');
            }
        }

        console.log('\n🎉 Admin functionality test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testAdminFunctionality();
