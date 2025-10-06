import axios from 'axios';

const BASE_URL = 'http://localhost:3004/api';
const TEST_COLUMN_ID = '49a7af36-b485-4083-8aea-3f6b7f4acb4c'; // Same as in the screenshot

console.log('=== TESTING CREATE COLUMN PERMISSION ===');

async function testCreateColumnPermission() {
  try {
    // Step 1: Login
    console.log('\n🔍 Step 1: Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/auth/sign-in`, {
      email: 'manager@test.com',
      password: 'Manager123'
    });
    
    const token = loginRes.data.accessToken;
    console.log('✅ Login successful');
    
    // Step 2: Test creating column permission
    console.log('\n🔍 Step 2: Creating column permission...');
    const permissionData = {
      targetType: 'specific_role',
      role: 'member',
      canView: false,
      canEdit: false,
      name: 'Test',
      note: ''
    };
    
    console.log('📋 Permission data:', JSON.stringify(permissionData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/permissions/columns/${TEST_COLUMN_ID}/permissions`, permissionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Create permission Status:', response.status);
    console.log('✅ Create permission Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data?.message);
    if (error.response?.data) {
      console.log('❌ Error details:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('❌ Full error:', error.message);
  }
}

testCreateColumnPermission();
