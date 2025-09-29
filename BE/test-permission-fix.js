import axios from 'axios';

const BASE_URL = 'http://localhost:3004/api';

async function testPermissionAPI() {
  console.log('🧪 Testing Permission API...\n');

  try {
    // Test table permissions endpoint
    const tableId = 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380'; // PostgreSQL UUID
    
    console.log('🔄 Testing table permissions API...');
    const response = await axios.get(`${BASE_URL}/permissions/tables/${tableId}/permissions`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   ✅ Table permissions API working`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, response.data);
    
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ API Error: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`);
    } else {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
  }
}

testPermissionAPI();
