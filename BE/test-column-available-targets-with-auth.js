import axios from 'axios';

const BASE_URL = 'http://localhost:3004/api';
const TEST_COLUMN_ID = 'c75659e5-7bab-4e3c-bdb6-d3eb7ad8b7cf'; // Real column ID from database

console.log('=== TESTING COLUMN AVAILABLE TARGETS API WITH AUTH ===');

// Test 1: Get available targets for column without auth
async function testWithoutAuth() {
  try {
    console.log('\n🔍 Test 1: Getting available targets without auth...');
    
    const response = await axios.get(`${BASE_URL}/permissions/columns/${TEST_COLUMN_ID}/available-targets`);
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Expected error without auth:', error.response?.status, error.response?.data?.message);
  }
}

// Test 2: Get available targets for column with fake auth
async function testWithFakeAuth() {
  try {
    console.log('\n🔍 Test 2: Getting available targets with fake auth...');
    
    const response = await axios.get(`${BASE_URL}/permissions/columns/${TEST_COLUMN_ID}/available-targets`, {
      headers: {
        'Cookie': 'authToken=fake-token'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error with fake auth:', error.response?.status, error.response?.data?.message);
  }
}

// Test 3: Test a working endpoint first
async function testWorkingEndpoint() {
  try {
    console.log('\n🔍 Test 3: Testing a working endpoint...');
    
    const response = await axios.get(`${BASE_URL}/health`);
    
    console.log('✅ Health endpoint Status:', response.status);
    console.log('✅ Health endpoint Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Health endpoint error:', error.response?.status, error.response?.data?.message);
  }
}

// Test 4: Test column permissions endpoint
async function testColumnPermissions() {
  try {
    console.log('\n🔍 Test 4: Testing column permissions endpoint...');
    
    const response = await axios.get(`${BASE_URL}/permissions/columns/${TEST_COLUMN_ID}/permissions`);
    
    console.log('✅ Column permissions Status:', response.status);
    console.log('✅ Column permissions Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Column permissions error:', error.response?.status, error.response?.data?.message);
  }
}

// Run tests
async function runTests() {
  await testWorkingEndpoint();
  await testWithoutAuth();
  await testWithFakeAuth();
  await testColumnPermissions();
  console.log('\n✅ All tests completed');
}

runTests().catch(console.error);
