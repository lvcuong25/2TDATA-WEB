import axios from 'axios';

const BASE_URL = 'http://localhost:3004/api';
const TEST_TABLE_ID = '68de834d188faaa09c80b007'; // Real table ID from database

console.log('=== TESTING TABLE AVAILABLE TARGETS API ===');

// Test 1: Login with manager@test.com
async function loginAndGetToken() {
  try {
    console.log('\n🔍 Step 1: Logging in with manager@test.com...');
    
    const response = await axios.post(`${BASE_URL}/auth/sign-in`, {
      email: 'manager@test.com',
      password: 'Manager123'
    });
    
    console.log('✅ Login Status:', response.status);
    console.log('✅ Login Response:', JSON.stringify(response.data, null, 2));
    
    // Extract token from response data
    if (response.data && response.data.accessToken) {
      const token = response.data.accessToken;
      console.log('✅ Auth Token:', token);
      return token;
    }
    
    return null;
    
  } catch (error) {
    console.log('❌ Login error:', error.response?.status, error.response?.data?.message);
    console.log('❌ Full error:', error.message);
    if (error.response?.data) {
      console.log('❌ Error response data:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Test 2: Test table available targets with token
async function testTableAvailableTargets(token) {
  try {
    console.log('\n🔍 Step 2: Testing table available targets with token...');
    
    const response = await axios.get(`${BASE_URL}/permissions/tables/${TEST_TABLE_ID}/available-targets`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Table available targets Status:', response.status);
    console.log('✅ Table available targets Data:', JSON.stringify(response.data, null, 2));
    
    return true;
    
  } catch (error) {
    console.log('❌ Table available targets error:', error.response?.status, error.response?.data?.message);
    if (error.response?.data) {
      console.log('❌ Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Test 3: Test with different table ID
async function testWithDifferentTable(token) {
  try {
    console.log('\n🔍 Step 3: Testing with different table ID...');
    
    const tableId = '68de834d188faaa09c80b008'; // Different table ID
    
    const response = await axios.get(`${BASE_URL}/permissions/tables/${tableId}/available-targets`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Different table Status:', response.status);
    console.log('✅ Different table Data:', JSON.stringify(response.data, null, 2));
    
    return true;
    
  } catch (error) {
    console.log('❌ Different table error:', error.response?.status, error.response?.data?.message);
    if (error.response?.data) {
      console.log('❌ Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Run all tests
async function runTests() {
  const token = await loginAndGetToken();
  
  if (token) {
    await testTableAvailableTargets(token);
    await testWithDifferentTable(token);
  }
  
  console.log('\n✅ All tests completed');
}

runTests().catch(console.error);
