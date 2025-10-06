import axios from 'axios';

const BASE_URL = 'http://localhost:3004/api';
const TEST_COLUMN_ID = 'c75659e5-7bab-4e3c-bdb6-d3eb7ad8b7cf'; // Real column ID from database
const TEST_USER_ID = '68d6be17362e0b14adfa4367'; // test@hcw.com.vn

console.log('=== TESTING COLUMN AVAILABLE TARGETS API ===');

// Test 1: Get available targets for column
async function testGetColumnAvailableTargets() {
  try {
    console.log('\n🔍 Test 1: Getting available targets for column...');
    console.log('Column ID:', TEST_COLUMN_ID);
    
    const response = await axios.get(`${BASE_URL}/permissions/columns/${TEST_COLUMN_ID}/available-targets`, {
      headers: {
        'Cookie': 'authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQ2YmUxNzM2MmUwYjE0YWRmYTQzNjciLCJpYXQiOjE3MzUxNzQ4NzQsImV4cCI6MTczNTE3ODQ3NH0.8QZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const { users, roles, canCreateAllMembers } = response.data.data;
      console.log(`✅ Found ${users?.length || 0} available users`);
      console.log(`✅ Found ${roles?.length || 0} available roles`);
      console.log(`✅ Can create all members: ${canCreateAllMembers}`);
      
      if (users && users.length > 0) {
        console.log('Available users:');
        users.forEach((user, index) => {
          console.log(`  User ${index + 1}:`, {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          });
        });
      }
      
      if (roles && roles.length > 0) {
        console.log('Available roles:');
        roles.forEach((role, index) => {
          console.log(`  Role ${index + 1}:`, {
            role: role.role,
            displayName: role.displayName
          });
        });
      }
    }
    
  } catch (error) {
    console.log('❌ Error getting column available targets:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.log('❌ 500 Internal Server Error - check server logs');
    } else if (error.response?.status === 404) {
      console.log('❌ 404 Not Found - column might not exist');
    }
  }
}

// Test 2: Test with invalid column ID
async function testInvalidColumnId() {
  try {
    console.log('\n🔍 Test 2: Testing with invalid column ID...');
    
    const response = await axios.get(`${BASE_URL}/permissions/columns/invalid-column-id/available-targets`, {
      headers: {
        'Cookie': 'authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQ2YmUxNzM2MmUwYjE0YWRmYTQzNjciLCJpYXQiOjE3MzUxNzQ4NzQsImV4cCI6MTczNTE3ODQ3NH0.8QZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('✅ Expected error for invalid column ID:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  await testGetColumnAvailableTargets();
  await testInvalidColumnId();
  console.log('\n✅ All tests completed');
}

runTests().catch(console.error);
