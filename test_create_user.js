const axios = require('axios');

async function testCreateUser() {
    try {
        // 1. Login với site_admin account
        console.log('1. Logging in as site_admin...');
        const loginResponse = await axios.post('http://localhost:3005/api/auth/login', {
            email: 'siteadmin@nguyenhung.com',
            password: 'Admin@123'
        });

        const token = loginResponse.data.token;
        console.log('✓ Login successful, token received');

        // 2. Tạo user mới
        console.log('\n2. Creating new user...');
        const createUserResponse = await axios.post('http://localhost:3005/api/user', {
            email: 'testuser' + Date.now() + '@nguyenhung.com',
            name: 'Test User',
            password: 'Test@123',
            role: 'member'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✓ User created successfully:', createUserResponse.data);

    } catch (error) {
        console.error('✗ Error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.error('Authentication failed - check credentials');
        }
    }
}

testCreateUser();
