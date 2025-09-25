import axios from 'axios';

// Test the API endpoint for Test Role database
const API_BASE = 'http://localhost:3004/api';
const databaseId = '68d4068c5a40b576555afbf8'; // Test Role database ID

async function testTestRoleAPI() {
  try {
    console.log('🔍 Testing API for Test Role database...');
    
    // Sign in first
    console.log('\n1. Signing in...');
    const signInResponse = await axios.post(`${API_BASE}/auth/sign-in`, {
      email: 'trunglq8.93@gmail.com',
      password: 'Quangtrung93@'
    });
    
    const token = signInResponse.data.accessToken;
    console.log('✅ Sign-in successful');
    
    // Test /me endpoint
    console.log(`\n2. Testing /me endpoint for database ${databaseId}...`);
    const meResponse = await axios.get(`${API_BASE}/database/databases/${databaseId}/members/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ /me endpoint response:');
    console.log(JSON.stringify(meResponse.data, null, 2));
    
    // Test /members endpoint
    console.log(`\n3. Testing /members endpoint for database ${databaseId}...`);
    const membersResponse = await axios.get(`${API_BASE}/database/databases/${databaseId}/members`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ /members endpoint response:');
    console.log(JSON.stringify(membersResponse.data, null, 2));
    
    // Test database detail endpoint
    console.log(`\n4. Testing database detail endpoint...`);
    const detailResponse = await axios.get(`${API_BASE}/database/databases/${databaseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Database detail response:');
    console.log(JSON.stringify(detailResponse.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error Response:');
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testTestRoleAPI();
