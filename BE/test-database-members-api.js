import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const TEST_DATABASE_ID = '68de834d188faaa09c80b006'; // 2TDATA-P database
const TEST_USER_ID = '68d6be17362e0b14adfa4367'; // test@hcw.com.vn

console.log('=== TESTING DATABASE MEMBERS API ===');

// Test 1: Get database members
async function testGetDatabaseMembers() {
  try {
    console.log('\n🔍 Test 1: Getting database members...');
    console.log('Database ID:', TEST_DATABASE_ID);
    
    const response = await axios.get(`${BASE_URL}/permissions/database/databases/${TEST_DATABASE_ID}/members`, {
      headers: {
        'Cookie': 'authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQ2YmUxNzM2MmUwYjE0YWRmYTQzNjciLCJpYXQiOjE3MzUxNzQ4NzQsImV4cCI6MTczNTE3ODQ3NH0.8QZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      console.log(`✅ Found ${response.data.data.length} members`);
      response.data.data.forEach((member, index) => {
        console.log(`  Member ${index + 1}:`, {
          id: member._id,
          userId: member.userId?._id,
          name: member.userId?.name,
          email: member.userId?.email,
          role: member.role
        });
      });
    }
    
  } catch (error) {
    console.log('❌ Error getting database members:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.log('❌ 500 Internal Server Error - check server logs');
    }
  }
}

// Test 2: Check if user can access the API
async function testUserAccess() {
  try {
    console.log('\n🔍 Test 2: Testing user access...');
    
    // First, let's try to get user info
    const userResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Cookie': 'authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQ2YmUxNzM2MmUwYjE0YWRmYTQzNjciLCJpYXQiOjE3MzUxNzQ4NzQsImV4cCI6MTczNTE3ODQ3NH0.8QZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ'
      }
    });
    
    console.log('✅ User info:', JSON.stringify(userResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error getting user info:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  await testUserAccess();
  await testGetDatabaseMembers();
  console.log('\n✅ All tests completed');
}

runTests().catch(console.error);
