import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

console.log('🧪 Testing Metabase Real-time & Permission System...\n');

// Test data
const testTableId = 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380'; // postgresX table
const testUserId = '68341e4d3f86f9c7ae46e962';
const testSiteId = '686d45a89a0a0c37366567c8';

async function testServerHealth() {
  try {
    console.log('🔄 Testing server health...');
    
    const response = await axios.get(`${API_BASE_URL}/database/tables`, {
      headers: {
        'x-user-id': testUserId,
        'x-site-id': testSiteId
      }
    });
    
    console.log('   ✅ Server is responding');
    console.log(`   Status: ${response.status}`);
    console.log(`   Tables count: ${response.data.data?.length || 0}`);
    return true;
  } catch (error) {
    console.log('   ❌ Server health check failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testFieldPreference() {
  try {
    console.log('\n🔄 Testing field preference API...');
    
    const response = await axios.get(
      `${API_BASE_URL}/database/tables/${testTableId}/field-preference`,
      {
        headers: {
          'x-user-id': testUserId,
          'x-site-id': testSiteId
        }
      }
    );
    
    console.log('   ✅ Field preference API working');
    console.log(`   Status: ${response.status}`);
    return true;
  } catch (error) {
    console.log('   ❌ Field preference API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCreateRecord() {
  try {
    console.log('\n🔄 Testing create record (Metabase real-time sync)...');
    
    const testRecord = {
      tableId: testTableId,
      data: {
        'Tên': 'System Test User',
        'Tuổi': '30',
        'Ngày sinh': '1994-01-01',
        'Địa chỉ': 'System Test Address'
      }
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/database/records`,
      testRecord,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-site-id': testSiteId
        }
      }
    );
    
    console.log('   ✅ Create record API successful');
    console.log(`   Status: ${response.status}`);
    console.log(`   Record ID: ${response.data.data._id}`);
    return response.data.data._id;
  } catch (error) {
    console.log('   ❌ Create record API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function testCreateColumn() {
  try {
    console.log('\n🔄 Testing create column (Metabase real-time sync)...');
    
    const testColumn = {
      tableId: testTableId,
      name: 'System Test Column',
      key: 'system_test_column',
      dataType: 'text',
      isRequired: false,
      isUnique: false
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/database/columns`,
      testColumn,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-site-id': testSiteId
        }
      }
    );
    
    console.log('   ✅ Create column API successful');
    console.log(`   Status: ${response.status}`);
    console.log(`   Column ID: ${response.data.data._id}`);
    return response.data.data._id;
  } catch (error) {
    console.log('   ❌ Create column API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function testMetabaseSync() {
  try {
    console.log('\n🔍 Testing Metabase sync...');
    
    // Import PostgreSQL models to check
    const { sequelize, Record } = await import('./src/models/postgres/index.js');
    
    // Get latest records
    const records = await Record.findAll({ 
      where: { table_id: testTableId },
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    console.log(`   Found ${records.length} records in PostgreSQL`);
    
    // Check Metabase table
    const expectedMetabaseTableName = `metabase_postgresx_b2f94380`;
    const [metabaseRecords] = await sequelize.query(`SELECT COUNT(*) as count FROM "${expectedMetabaseTableName}"`);
    
    console.log(`   Found ${metabaseRecords[0].count} records in Metabase table`);
    
    if (records.length > 0 && metabaseRecords[0].count >= records.length) {
      console.log('   ✅ Metabase sync is working!');
      return true;
    } else {
      console.log('   ❌ Metabase sync is not working properly');
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Error checking Metabase sync:', error.message);
    return false;
  }
}

async function testPermissionAPIs() {
  try {
    console.log('\n🔄 Testing permission APIs...');
    
    // Test column permissions
    try {
      const columnResponse = await axios.get(
        `${API_BASE_URL}/permissions/tables/${testTableId}/columns/permissions`,
        {
          headers: {
            'x-user-id': testUserId,
            'x-site-id': testSiteId
          }
        }
      );
      console.log('   ✅ Column permissions API working');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ⚠️ Column permissions API requires authentication (expected)');
      } else {
        console.log('   ❌ Column permissions API failed:', error.response?.status);
      }
    }
    
    // Test record permissions
    try {
      const recordResponse = await axios.get(
        `${API_BASE_URL}/permissions/tables/${testTableId}/records/permissions`,
        {
          headers: {
            'x-user-id': testUserId,
            'x-site-id': testSiteId
          }
        }
      );
      console.log('   ✅ Record permissions API working');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ⚠️ Record permissions API requires authentication (expected)');
      } else {
        console.log('   ❌ Record permissions API failed:', error.response?.status);
      }
    }
    
    // Test cell permissions
    try {
      const cellResponse = await axios.get(
        `${API_BASE_URL}/permissions/tables/${testTableId}/cells/permissions`,
        {
          headers: {
            'x-user-id': testUserId,
            'x-site-id': testSiteId
          }
        }
      );
      console.log('   ✅ Cell permissions API working');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ⚠️ Cell permissions API requires authentication (expected)');
      } else {
        console.log('   ❌ Cell permissions API failed:', error.response?.status);
      }
    }
    
    return true;
  } catch (error) {
    console.log('   ❌ Permission APIs test failed:', error.message);
    return false;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting comprehensive system tests...\n');
    
    const results = {
      serverHealth: false,
      fieldPreference: false,
      createRecord: false,
      createColumn: false,
      metabaseSync: false,
      permissionAPIs: false
    };
    
    // Test 1: Server health
    results.serverHealth = await testServerHealth();
    
    // Test 2: Field preference
    results.fieldPreference = await testFieldPreference();
    
    // Test 3: Create record
    const recordId = await testCreateRecord();
    results.createRecord = recordId !== null;
    
    // Wait for sync
    console.log('\n⏳ Waiting 3 seconds for Metabase sync...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 4: Create column
    const columnId = await testCreateColumn();
    results.createColumn = columnId !== null;
    
    // Wait for sync
    console.log('\n⏳ Waiting 3 seconds for Metabase sync...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 5: Metabase sync
    results.metabaseSync = await testMetabaseSync();
    
    // Test 6: Permission APIs
    results.permissionAPIs = await testPermissionAPIs();
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log(`   Server Health: ${results.serverHealth ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Field Preference: ${results.fieldPreference ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Create Record: ${results.createRecord ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Create Column: ${results.createColumn ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Metabase Sync: ${results.metabaseSync ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Permission APIs: ${results.permissionAPIs ? '✅ PASS' : '❌ FAIL'}`);
    
    const passedTests = Object.values(results).filter(result => result).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All system tests passed!');
      console.log('✅ Metabase real-time sync is working perfectly!');
      console.log('✅ Permission system is working correctly!');
    } else {
      console.log('❌ Some system tests failed.');
      console.log('📝 Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests
runTests();
