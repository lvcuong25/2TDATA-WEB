const axios = require('axios');

const BASE_URL = 'http://localhost:3004/api';
const TEST_COLUMN_ID = '49a7af36-b485-4083-8aea-3f6b7f4acb4c';
const TEST_TABLE_ID = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
const TEST_RECORD_ID = 'e77ff2ac-64c9-4a05-a881-2b7e36fba63e';
const TEST_USER_EMAIL = 'test@hcw.com.vn';
const TEST_USER_PASSWORD = 'Test123';

console.log('=== TESTING FIXED COLUMN PERMISSIONS ===');

async function testFixedPermissions() {
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
    
    // Step 2: Test updating record (should preserve data for columns without edit permission)
    console.log('\n🔍 Step 2: Testing record update (should preserve existing data)...');
    const updateRecordRes = await axios.put(`${BASE_URL}/database/records/${TEST_RECORD_ID}`, {
      data: {
        "TEst": "Updated by test user",
        "permission": "Updated by test user", 
        "Test Column 3": "Updated by test user",
        "New Test Column1": "Should NOT be updated" // This column has canEdit: false
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Update record Status:', updateRecordRes.status);
    console.log('✅ Update record Data:', JSON.stringify(updateRecordRes.data, null, 2));
    
    // Step 3: Test updating column (should fail with 403)
    console.log('\n🔍 Step 3: Testing column update (should fail with 403)...');
    try {
      const updateColumnRes = await axios.put(`${BASE_URL}/database/columns/${TEST_COLUMN_ID}`, {
        name: "Updated Column Name"
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('❌ Column update should have failed but succeeded:', updateColumnRes.status);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Column update correctly failed with 403:', error.response.data.message);
      } else {
        console.log('❌ Column update failed with unexpected error:', error.response?.status, error.response?.data?.message);
      }
    }
    
    // Step 4: Test deleting column (should fail with 403)
    console.log('\n🔍 Step 4: Testing column delete (should fail with 403)...');
    try {
      const deleteColumnRes = await axios.delete(`${BASE_URL}/database/columns/${TEST_COLUMN_ID}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('❌ Column delete should have failed but succeeded:', deleteColumnRes.status);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Column delete correctly failed with 403:', error.response.data.message);
      } else {
        console.log('❌ Column delete failed with unexpected error:', error.response?.status, error.response?.data?.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data?.message);
    console.log('❌ Full error:', error.message);
    if (error.response?.data) {
      console.log('❌ Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFixedPermissions();
