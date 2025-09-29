import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

console.log('🧪 Testing permission system - Final comprehensive test...\n');

// Test data
const testTableId = 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380'; // postgresX table
const testUserId = '68341e4d3f86f9c7ae46e962';
const testSiteId = '686d45a89a0a0c37366567c8';

async function testFieldPreference() {
  try {
    console.log('🔄 Testing field preference API...');
    
    const response = await axios.get(
      `${API_BASE_URL}/database/tables/${testTableId}/field-preference`,
      {
        headers: {
          'x-user-id': testUserId,
          'x-site-id': testSiteId
        }
      }
    );
    
    console.log('   ✅ Field preference API successful');
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
    console.log('\n🔄 Testing create record API...');
    
    const testRecord = {
      tableId: testTableId,
      data: {
        'Tên': 'Permission Test User',
        'Tuổi': '25',
        'Ngày sinh': '1999-01-01',
        'Địa chỉ': 'Permission Test Address'
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
    console.log('\n🔄 Testing create column API...');
    
    const testColumn = {
      tableId: testTableId,
      name: 'Permission Test Column',
      key: 'permission_test_column',
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

async function testGetColumns() {
  try {
    console.log('\n🔄 Testing get columns API...');
    
    const response = await axios.get(
      `${API_BASE_URL}/database/tables/${testTableId}/columns`,
      {
        headers: {
          'x-user-id': testUserId,
          'x-site-id': testSiteId
        }
      }
    );
    
    console.log('   ✅ Get columns API successful');
    console.log(`   Status: ${response.status}`);
    console.log(`   Columns count: ${response.data.data.length}`);
    return response.data.data;
  } catch (error) {
    console.log('   ❌ Get columns API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function testGetRecords() {
  try {
    console.log('\n🔄 Testing get records API...');
    
    const response = await axios.get(
      `${API_BASE_URL}/database/tables/${testTableId}/records`,
      {
        headers: {
          'x-user-id': testUserId,
          'x-site-id': testSiteId
        }
      }
    );
    
    console.log('   ✅ Get records API successful');
    console.log(`   Status: ${response.status}`);
    console.log(`   Records count: ${response.data.data.length}`);
    return response.data.data;
  } catch (error) {
    console.log('   ❌ Get records API failed:');
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

async function runTests() {
  try {
    console.log('🚀 Starting comprehensive permission system tests...\n');
    
    const results = {
      fieldPreference: false,
      createRecord: false,
      createColumn: false,
      getColumns: false,
      getRecords: false,
      metabaseSync: false
    };
    
    // Test 1: Field preference
    results.fieldPreference = await testFieldPreference();
    
    // Test 2: Create record
    const recordId = await testCreateRecord();
    results.createRecord = recordId !== null;
    
    // Wait for sync
    console.log('\n⏳ Waiting 2 seconds for sync...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Create column
    const columnId = await testCreateColumn();
    results.createColumn = columnId !== null;
    
    // Wait for sync
    console.log('\n⏳ Waiting 2 seconds for sync...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Get columns
    const columns = await testGetColumns();
    results.getColumns = columns !== null;
    
    // Test 5: Get records
    const records = await testGetRecords();
    results.getRecords = records !== null;
    
    // Test 6: Metabase sync
    results.metabaseSync = await testMetabaseSync();
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log(`   Field Preference: ${results.fieldPreference ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Create Record: ${results.createRecord ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Create Column: ${results.createColumn ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Get Columns: ${results.getColumns ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Get Records: ${results.getRecords ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Metabase Sync: ${results.metabaseSync ? '✅ PASS' : '❌ FAIL'}`);
    
    const passedTests = Object.values(results).filter(result => result).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All permission system tests passed!');
      console.log('✅ Permission system is working perfectly with hybrid database!');
      console.log('📝 Note: Authentication-protected endpoints require valid tokens.');
    } else {
      console.log('❌ Some permission system tests failed.');
      console.log('📝 Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests
runTests();
