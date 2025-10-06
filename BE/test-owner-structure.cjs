const axios = require('axios');

const BASE_URL = 'http://localhost:3004/api';
const TEST_TABLE_ID = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
const OWNER_EMAIL = 'manager@test.com';
const OWNER_PASSWORD = 'Manager123';

console.log('=== TESTING OWNER TABLE STRUCTURE ===');

async function testOwnerStructure() {
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
    
    // Step 2: Test table structure API
    console.log('\n🔍 Step 2: Testing table structure API...');
    const structureRes = await axios.get(`${BASE_URL}/database/tables/${TEST_TABLE_ID}/structure`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Table structure Status:', structureRes.status);
    console.log('✅ Table structure Data:', JSON.stringify(structureRes.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data?.message);
    console.log('❌ Full error:', error.message);
    if (error.response?.data) {
      console.log('❌ Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testOwnerStructure();
