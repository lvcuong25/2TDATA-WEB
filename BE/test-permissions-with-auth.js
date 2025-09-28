import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

console.log('🧪 Testing permission APIs with authentication...\n');

// Test data
const testTableId = 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380'; // postgresX table
const testUserId = '68341e4d3f86f9c7ae46e962';
const testSiteId = '686d45a89a0a0c37366567c8';

// Mock authentication token (you might need to get a real one)
const authToken = 'mock-auth-token';

async function testColumnPermissions() {
  try {
    console.log('🔄 Testing column permissions API...');
    
    const response = await axios.get(
      `${API_BASE_URL}/permissions/tables/${testTableId}/columns/permissions`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-user-id': testUserId,
          'x-site-id': testSiteId
        }
      }
    );
    
    console.log('   ✅ Column permissions API successful');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    return true;
  } catch (error) {
    console.log('   ❌ Column permissions API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testRecordPermissions() {
  try {
    console.log('\n🔄 Testing record permissions API...');
    
    const response = await axios.get(
      `${API_BASE_URL}/permissions/tables/${testTableId}/records/permissions`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-user-id': testUserId,
          'x-site-id': testSiteId
        }
      }
    );
    
    console.log('   ✅ Record permissions API successful');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    return true;
  } catch (error) {
    console.log('   ❌ Record permissions API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCellPermissions() {
  try {
    console.log('\n🔄 Testing cell permissions API...');
    
    const response = await axios.get(
      `${API_BASE_URL}/permissions/tables/${testTableId}/cells/permissions`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-user-id': testUserId,
          'x-site-id': testSiteId
        }
      }
    );
    
    console.log('   ✅ Cell permissions API successful');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    return true;
  } catch (error) {
    console.log('   ❌ Cell permissions API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCreateColumnPermission() {
  try {
    console.log('\n🔄 Testing create column permission API...');
    
    // Get a column ID first
    const columnsResponse = await axios.get(
      `${API_BASE_URL}/database/tables/${testTableId}/columns`,
      {
        headers: {
          'x-user-id': testUserId,
          'x-site-id': testSiteId
        }
      }
    );
    
    if (columnsResponse.data.success && columnsResponse.data.data.length > 0) {
      const columnId = columnsResponse.data.data[0]._id;
      
      const permissionData = {
        userId: testUserId,
        permission: 'read'
      };
      
      const response = await axios.post(
        `${API_BASE_URL}/permissions/columns/${columnId}/permissions`,
        permissionData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'x-user-id': testUserId,
            'x-site-id': testSiteId
          }
        }
      );
      
      console.log('   ✅ Create column permission API successful');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, response.data);
      return true;
    } else {
      console.log('   ❌ No columns found to test permission creation');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Create column permission API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting permission APIs tests with authentication...\n');
    
    const results = {
      columnPermissions: false,
      recordPermissions: false,
      cellPermissions: false,
      createColumnPermission: false
    };
    
    // Test 1: Column permissions
    results.columnPermissions = await testColumnPermissions();
    
    // Test 2: Record permissions
    results.recordPermissions = await testRecordPermissions();
    
    // Test 3: Cell permissions
    results.cellPermissions = await testCellPermissions();
    
    // Test 4: Create column permission
    results.createColumnPermission = await testCreateColumnPermission();
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log(`   Column Permissions: ${results.columnPermissions ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Record Permissions: ${results.recordPermissions ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Cell Permissions: ${results.cellPermissions ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Create Column Permission: ${results.createColumnPermission ? '✅ PASS' : '❌ FAIL'}`);
    
    const passedTests = Object.values(results).filter(result => result).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All permission API tests passed!');
    } else {
      console.log('❌ Some permission API tests failed.');
      console.log('📝 Note: Authentication might be required for these endpoints.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests
runTests();
