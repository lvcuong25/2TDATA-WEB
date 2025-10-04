import axios from 'axios';

const BASE_URL = 'http://localhost:3004/api';

console.log('=== TESTING AUTH TOKEN ===');

// Test with the token from DevTools
async function testWithToken() {
  try {
    console.log('\n🔍 Testing with token from DevTools...');
    
    const response = await axios.get(`${BASE_URL}/auth/`, {
      headers: {
        'Cookie': 'authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQ2YmUxNzM2MmUwYjE0YWRmYTQzNjciLCJpYXQiOjE3MzUxNzQ4NzQsImV4cCI6MTczNTE3ODQ3NH0.8QZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ'
      }
    });
    
    console.log('✅ Auth endpoint Status:', response.status);
    console.log('✅ Auth endpoint Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Auth endpoint error:', error.response?.status, error.response?.data?.message);
  }
}

// Test without token
async function testWithoutToken() {
  try {
    console.log('\n🔍 Testing without token...');
    
    const response = await axios.get(`${BASE_URL}/auth/`);
    
    console.log('✅ Auth endpoint Status:', response.status);
    console.log('✅ Auth endpoint Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Expected error without token:', error.response?.status, error.response?.data?.message);
  }
}

// Run tests
async function runTests() {
  await testWithoutToken();
  await testWithToken();
  console.log('\n✅ All tests completed');
}

runTests().catch(console.error);
