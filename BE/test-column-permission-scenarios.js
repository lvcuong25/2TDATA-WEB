import axios from 'axios';

const BASE_URL = 'http://localhost:3004/api';
const TEST_COLUMN_ID = '49a7af36-b485-4083-8aea-3f6b7f4acb4c';
const TEST_USER_EMAIL = 'test@hcw.com.vn';
const TEST_USER_PASSWORD = 'Test123';

console.log('=== TESTING COLUMN PERMISSION SCENARIOS ===');

async function testColumnPermissionScenarios() {
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
    
    // Step 2: Update permission to canView: true, canEdit: false
    console.log('\n🔍 Step 2: Updating permission to canView: true, canEdit: false...');
    const updateRes = await axios.put(`${BASE_URL}/permissions/columns/permissions/68e13d8128f900b084b2ea07`, {
      canView: true,
      canEdit: false,
      name: 'Test',
      note: 'Updated permission'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Update permission Status:', updateRes.status);
    console.log('✅ Update permission Data:', JSON.stringify(updateRes.data, null, 2));
    
    // Step 3: Check user permission after update
    console.log('\n🔍 Step 3: Checking user permission after update...');
    const permissionRes = await axios.get(`${BASE_URL}/permissions/columns/${TEST_COLUMN_ID}/user-permission`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ User column permission Status:', permissionRes.status);
    console.log('✅ User column permission Data:', JSON.stringify(permissionRes.data, null, 2));
    
    // Step 4: Test table records API
    console.log('\n🔍 Step 4: Testing table records API...');
    const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
    const recordsRes = await axios.get(`${BASE_URL}/database/tables/${tableId}/records`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Table records Status:', recordsRes.status);
    console.log('✅ Table records Data:', JSON.stringify(recordsRes.data, null, 2));
    
    // Step 5: Test updating a record (to see if canEdit affects record updates)
    console.log('\n🔍 Step 5: Testing record update...');
    const recordId = 'e77ff2ac-64c9-4a05-a881-2b7e36fba63e';
    const updateRecordRes = await axios.put(`${BASE_URL}/database/records/${recordId}`, {
      data: {
        "TEst": "Updated by test user",
        "permission": "Updated by test user",
        "Test Column 3": "Updated by test user",
        "New Test Column1": "Updated by test user"
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
    if (error.response?.data) {
      console.log('❌ Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testColumnPermissionScenarios();
