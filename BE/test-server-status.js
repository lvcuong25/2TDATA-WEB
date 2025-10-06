import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

console.log('=== TESTING SERVER STATUS ===');

async function testServerStatus() {
  try {
    console.log('\n🔍 Testing server status...');
    
    // Test basic server health
    const response = await axios.get(`${BASE_URL}/health`, {
      timeout: 5000
    });
    
    console.log('✅ Server is running');
    console.log('✅ Response status:', response.status);
    console.log('✅ Response data:', response.data);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running - connection refused');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('❌ Server timeout - server might be slow or not responding');
    } else {
      console.log('❌ Server error:', error.message);
    }
  }
}

async function testAuthEndpoint() {
  try {
    console.log('\n🔍 Testing auth endpoint...');
    
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      timeout: 5000
    });
    
    console.log('✅ Auth endpoint is accessible');
    console.log('✅ Response status:', response.status);
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Auth endpoint is working (401 Unauthorized - expected without token)');
    } else {
      console.log('❌ Auth endpoint error:', error.message);
    }
  }
}

// Run tests
async function runTests() {
  await testServerStatus();
  await testAuthEndpoint();
  console.log('\n✅ All tests completed');
}

runTests().catch(console.error);