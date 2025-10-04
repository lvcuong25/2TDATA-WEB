import axios from 'axios';

const BASE_URL = 'http://localhost:3004/api';
const TEST_TABLE_ID = '68de834d188faaa09c80b007';

console.log('=== TESTING TABLE PERMISSION AVAILABLE TARGETS ===');

async function testTablePermission() {
  try {
    // Step 1: Login
    console.log('\n🔍 Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/sign-in`, {
      email: 'manager@test.com',
      password: 'Manager123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful, token:', token.substring(0, 50) + '...');
    
    // Step 2: Test table available targets
    console.log('\n🔍 Step 2: Testing table available targets...');
    const response = await axios.get(`${BASE_URL}/permissions/tables/${TEST_TABLE_ID}/available-targets`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Table available targets Status:', response.status);
    console.log('✅ Table available targets Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data?.message);
    if (error.response?.data) {
      console.log('❌ Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testTablePermission();
