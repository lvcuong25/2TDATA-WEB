const axios = require('axios');

const BASE_URL = 'http://localhost:3004/api';
const TEST_COLUMN_ID = '49a7af36-b485-4083-8aea-3f6b7f4acb4c';
const TEST_TABLE_ID = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
const TEST_USER_EMAIL = 'test@hcw.com.vn';
const TEST_USER_PASSWORD = 'Test123';

console.log('=== DEBUGGING COLUMN PERMISSIONS ===');

async function debugColumnPermissions() {
  try {
    // Step 1: Login as test@hcw.com.vn
    console.log('\n🔍 Step 1: Login as test@hcw.com.vn...');
    const loginRes = await axios.post(`${BASE_URL}/auth/sign-in`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    const token = loginRes.data.accessToken;
    const userId = loginRes.data.data._id;
    console.log('✅ Login successful');
    console.log('✅ User ID:', userId);
    
    // Step 2: Check user column permission
    console.log('\n🔍 Step 2: Checking user column permission...');
    const permissionRes = await axios.get(`${BASE_URL}/permissions/columns/${TEST_COLUMN_ID}/user-permission`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ User column permission Status:', permissionRes.status);
    console.log('✅ User column permission Data:', JSON.stringify(permissionRes.data, null, 2));
    
    // Step 3: Check all column permissions for this column
    console.log('\n🔍 Step 3: Checking all column permissions...');
    const allPermissionsRes = await axios.get(`${BASE_URL}/permissions/columns/${TEST_COLUMN_ID}/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ All column permissions Status:', allPermissionsRes.status);
    console.log('✅ All column permissions Data:', JSON.stringify(allPermissionsRes.data, null, 2));
    
    // Step 4: Check database members
    console.log('\n🔍 Step 4: Checking database members...');
    const membersRes = await axios.get(`${BASE_URL}/permissions/database/databases/68de834d188faaa09c80b006/members`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Database members Status:', membersRes.status);
    console.log('✅ Database members Data:', JSON.stringify(membersRes.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data?.message);
    console.log('❌ Full error:', error.message);
    if (error.response?.data) {
      console.log('❌ Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugColumnPermissions();
