import axios from 'axios';

const BASE_URL = 'http://localhost:3004/api';
const TEST_TABLE_ID = '68de834d188faaa09c80b007';

console.log('=== TESTING TABLE PERMISSION AVAILABLE TARGETS ===');

async function main() {
  try {
    // Login
    console.log('\n🔍 Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/auth/sign-in`, {
      email: 'manager@test.com',
      password: 'Manager123'
    });
    
    const token = loginRes.data.accessToken;
    console.log('✅ Login OK');
    
    // Test table available targets
    console.log('\n🔍 Testing table available targets...');
    const res = await axios.get(`${BASE_URL}/permissions/tables/${TEST_TABLE_ID}/available-targets`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Status:', res.status);
    console.log('✅ Data:', JSON.stringify(res.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('❌ Status:', error.response.status);
      console.log('❌ Data:', error.response.data);
    }
  }
}

main();
