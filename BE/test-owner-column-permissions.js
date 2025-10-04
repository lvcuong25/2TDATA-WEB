import axios from 'axios';

const BASE_URL = 'http://localhost:3004/api';
const TEST_COLUMN_ID = '49a7af36-b485-4083-8aea-3f6b7f4acb4c';
const TEST_TABLE_ID = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
const OWNER_EMAIL = 'manager@test.com';
const OWNER_PASSWORD = 'Manager123';

console.log('=== TESTING OWNER COLUMN PERMISSIONS ===');

async function testOwnerColumnPermissions() {
  try {
    // Step 1: Login as owner
    console.log('\n🔍 Step 1: Login as owner...');
    const loginRes = await axios.post(`${BASE_URL}/auth/sign-in`, {
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD
    });
    
    const token = loginRes.data.accessToken;
    const userId = loginRes.data.data._id;
    console.log('✅ Login successful');
    
    // Step 2: Check user column permission
    console.log('\n🔍 Step 2: Checking owner column permission...');
    const permissionRes = await axios.get(`${BASE_URL}/permissions/columns/${TEST_COLUMN_ID}/user-permission`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Owner column permission Status:', permissionRes.status);
    console.log('✅ Owner column permission Data:', JSON.stringify(permissionRes.data, null, 2));
    
    // Step 3: Test table records API (should see all columns)
    console.log('\n🔍 Step 3: Testing table records API (owner should see all columns)...');
    const recordsRes = await axios.get(`${BASE_URL}/database/tables/${TEST_TABLE_ID}/records`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Table records Status:', recordsRes.status);
    console.log('✅ Table records Data:', JSON.stringify(recordsRes.data, null, 2));
    
    // Step 4: Test updating a record (should be able to edit all columns)
    console.log('\n🔍 Step 4: Testing record update (owner should edit all columns)...');
    const recordId = 'e77ff2ac-64c9-4a05-a881-2b7e36fba63e';
    const updateRecordRes = await axios.put(`${BASE_URL}/database/records/${recordId}`, {
      data: {
        "TEst": "Updated by owner",
        "permission": "Updated by owner",
        "Test Column 3": "Updated by owner",
        "New Test Column1": "Updated by owner"
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Update record Status:', updateRecordRes.status);
    console.log('✅ Update record Data:', JSON.stringify(updateRecordRes.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data?.message);
    console.log('❌ Full error:', error.message);
    if (error.response?.data) {
      console.log('❌ Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testOwnerColumnPermissions();