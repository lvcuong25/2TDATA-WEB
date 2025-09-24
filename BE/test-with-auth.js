import axios from 'axios';

// Test with authentication
const API_BASE = 'http://localhost:3004/api';

async function testWithAuth() {
  try {
    console.log('🔍 Testing API with authentication...');
    
    // First, try to get auth token by signing in
    console.log('\n1. Testing sign-in...');
    const signInResponse = await axios.post(`${API_BASE}/auth/sign-in`, {
      email: 'trunglq8.93@gmail.com',
      password: 'Quangtrung93@'
    });
    
    console.log('✅ Sign-in successful');
    console.log('Response:', signInResponse.data);
    
    // Extract token from response
    const token = signInResponse.data.token || signInResponse.data.accessToken;
    if (!token) {
      console.log('❌ No token found in response');
      return;
    }
    
    console.log('\n2. Testing /me endpoint with token...');
    const databaseId = '68d400abc36df12bdeccc1ba';
    
    const meResponse = await axios.get(`${API_BASE}/database/databases/${databaseId}/members/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ /me endpoint successful');
    console.log('Response:', meResponse.data);
    
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

testWithAuth();
