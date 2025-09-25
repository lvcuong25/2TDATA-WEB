import axios from 'axios';

// Test the route with a simple approach
const API_BASE = 'http://localhost:3004/api';
const databaseId = '68d400abc36df12bdeccc1ba';

async function testRoute() {
  try {
    console.log('🔍 Testing route with different approaches...');
    
    // Test 1: Without authentication
    console.log('\n1. Testing without authentication:');
    try {
      const response = await axios.get(`${API_BASE}/database/databases/${databaseId}/me`);
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data);
    }
    
    // Test 2: With authentication
    console.log('\n2. Testing with authentication:');
    try {
      const signInResponse = await axios.post(`${API_BASE}/auth/sign-in`, {
        email: 'trunglq8.93@gmail.com',
        password: 'Quangtrung93@'
      });
      
      const token = signInResponse.data.accessToken;
      const response = await axios.get(`${API_BASE}/database/databases/${databaseId}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data);
    }
    
    // Test 3: Test other routes
    console.log('\n3. Testing other routes:');
    try {
      const signInResponse = await axios.post(`${API_BASE}/auth/sign-in`, {
        email: 'trunglq8.93@gmail.com',
        password: 'Quangtrung93@'
      });
      
      const token = signInResponse.data.accessToken;
      
      // Test members route
      const membersResponse = await axios.get(`${API_BASE}/database/databases/${databaseId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Members route works:', membersResponse.data);
      
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.log('❌ General Error:', error.message);
  }
}

testRoute();
