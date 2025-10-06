/**
 * Comprehensive test for table level permissions
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3004/api/database';
const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';

console.log('🔍 Comprehensive Table Permissions Test...');

// Test endpoints with their expected permissions
const testEndpoints = [
  // Table operations (should have permissions)
  {
    method: 'GET',
    url: `/tables/${tableId}/columns`,
    name: 'Get Columns',
    expectedPermission: 'canView',
    expectedStatus: [200, 401, 403]
  },
  {
    method: 'GET', 
    url: `/tables/${tableId}/records`,
    name: 'Get Records',
    expectedPermission: 'canView',
    expectedStatus: [200, 401, 403]
  },
  {
    method: 'GET',
    url: `/tables/${tableId}/structure`,
    name: 'Get Table Structure',
    expectedPermission: 'canView',
    expectedStatus: [200, 401, 403]
  },
  {
    method: 'POST',
    url: '/columns',
    name: 'Create Column',
    expectedPermission: 'canEditStructure',
    expectedStatus: [400, 401, 403] // 400 for missing data, 401/403 for auth/permission
  },
  {
    method: 'POST',
    url: '/records',
    name: 'Create Record',
    expectedPermission: 'canAddData',
    expectedStatus: [400, 401, 403] // 400 for missing data, 401/403 for auth/permission
  }
];

// Test table permissions API
async function testTablePermissionsAPI() {
  console.log('\n📝 TEST 1: Table Permissions API...');
  
  try {
    const response = await axios.get(`http://localhost:3004/api/permissions/table-permissions/${tableId}`, {
      validateStatus: () => true
    });
    
    console.log(`   📊 Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('   ✅ API working (requires authentication)');
    } else if (response.status === 200) {
      console.log('   ✅ API working (no auth required)');
      console.log('   📋 Permissions:', response.data);
    } else {
      console.log('   ⚠️ Unexpected status:', response.status);
    }
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

// Test individual endpoints
async function testIndividualEndpoints() {
  console.log('\n📝 TEST 2: Individual Endpoints...');
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`\n   🔍 Testing: ${endpoint.name}`);
      console.log(`      Method: ${endpoint.method}`);
      console.log(`      URL: ${endpoint.url}`);
      console.log(`      Expected Permission: ${endpoint.expectedPermission}`);
      
      const response = await axios({
        method: endpoint.method,
        url: BASE_URL + endpoint.url,
        data: endpoint.method === 'POST' ? { tableId: tableId } : undefined,
        validateStatus: () => true
      });
      
      console.log(`      📊 Status: ${response.status}`);
      
      if (endpoint.expectedStatus.includes(response.status)) {
        console.log(`      ✅ Expected status (${response.status})`);
        
        if (response.status === 401) {
          console.log('         🔐 Requires authentication');
        } else if (response.status === 403) {
          console.log('         🚫 Permission denied');
        } else if (response.status === 200) {
          console.log('         ✅ Access granted');
        } else if (response.status === 400) {
          console.log('         ⚠️ Bad request (missing data)');
        }
      } else {
        console.log(`      ⚠️ Unexpected status: ${response.status}`);
        console.log(`      📋 Response:`, response.data);
      }
      
    } catch (error) {
      console.log(`      ❌ Error: ${error.message}`);
    }
  }
}

// Test with authentication (if possible)
async function testWithAuth() {
  console.log('\n📝 TEST 3: Testing with Authentication...');
  
  try {
    // Try with a simple auth header
    const response = await axios.get(BASE_URL + `/tables/${tableId}/columns`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Cookie': 'authToken=test'
      },
      validateStatus: () => true
    });
    
    console.log(`   📊 Status with auth: ${response.status}`);
    
    if (response.status === 200) {
      console.log('   ✅ Authentication working');
    } else if (response.status === 401) {
      console.log('   🔐 Still requires valid authentication');
    } else if (response.status === 403) {
      console.log('   🚫 Permission denied (auth working, no permission)');
    }
    
  } catch (error) {
    console.log('   ❌ Auth test error:', error.message);
  }
}

// Main test function
async function runComprehensiveTest() {
  try {
    await testTablePermissionsAPI();
    await testIndividualEndpoints();
    await testWithAuth();
    
    console.log('\n🎉 Comprehensive Table Permissions Test Summary:');
    console.log('   📝 Check results above to see if table permissions are working correctly');
    console.log('   💡 Expected behavior:');
    console.log('      - Table permissions API should require authentication');
    console.log('      - Endpoints should return 401/403 without proper auth/permissions');
    console.log('      - With proper auth/permissions, endpoints should return 200');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run the tests
runComprehensiveTest();
