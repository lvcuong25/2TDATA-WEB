const axios = require('axios');

const BASE_URL = 'http://localhost:3004/api';
const TEST_TABLE_ID = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
const TEST_USER_EMAIL = 'test@hcw.com.vn';
const TEST_USER_PASSWORD = 'Test123';

console.log('=== TESTING TABLE STRUCTURE API ===');

async function testTableStructure() {
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
    
    // Step 2: Test table structure API
    console.log('\n🔍 Step 2: Testing table structure API...');
    const structureRes = await axios.get(`${BASE_URL}/database/tables/${TEST_TABLE_ID}/structure`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Table structure Status:', structureRes.status);
    console.log('✅ Table structure Data:', JSON.stringify(structureRes.data, null, 2));
    
    // Step 3: Test table columns API
    console.log('\n🔍 Step 3: Testing table columns API...');
    const columnsRes = await axios.get(`${BASE_URL}/database/tables/${TEST_TABLE_ID}/columns`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Table columns Status:', columnsRes.status);
    console.log('✅ Table columns Data:', JSON.stringify(columnsRes.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data?.message);
    console.log('❌ Full error:', error.message);
    if (error.response?.data) {
      console.log('❌ Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testTableStructure();
