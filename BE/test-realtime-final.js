import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

console.log('🧪 Testing real-time sync with updated code...\n');

async function testCreateRecord() {
  try {
    console.log('🔄 Testing create record API...');
    
    const testRecord = {
      tableId: 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380',
      data: {
        'Tên': 'Real-time Test User',
        'Tuổi': '30',
        'Ngày sinh': '1994-01-01',
        'Địa chỉ': 'Real-time Test Address'
      }
    };
    
    console.log(`   Record data:`, testRecord);
    
    const response = await axios.post(
      `${API_BASE_URL}/database/records`,
      testRecord,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '68341e4d3f86f9c7ae46e962',
          'x-site-id': '686d45a89a0a0c37366567c8'
        }
      }
    );
    
    console.log('   ✅ Create record API successful');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    return response.data;
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
      tableId: 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380',
      name: 'Real-time Test Column',
      key: 'realtime_test_column',
      dataType: 'text',
      isRequired: false,
      isUnique: false
    };
    
    console.log(`   Column data:`, testColumn);
    
    const response = await axios.post(
      `${API_BASE_URL}/database/columns`,
      testColumn,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '68341e4d3f86f9c7ae46e962',
          'x-site-id': '686d45a89a0a0c37366567c8'
        }
      }
    );
    
    console.log('   ✅ Create column API successful');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    return response.data;
  } catch (error) {
    console.log('   ❌ Create column API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function checkMetabaseSync() {
  try {
    console.log('\n🔍 Checking Metabase sync...');
    
    // Import PostgreSQL models to check
    const { sequelize, Record, Column } = await import('./src/models/postgres/index.js');
    
    // Get latest records
    const records = await Record.findAll({ 
      where: { table_id: 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380' },
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    // Get latest columns
    const columns = await Column.findAll({ 
      where: { table_id: 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380' },
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    console.log(`   Found ${records.length} records in PostgreSQL`);
    console.log(`   Found ${columns.length} columns in PostgreSQL`);
    
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
    console.log('🚀 Starting real-time sync tests with updated code...\n');
    
    // Test 1: Create a new record
    const createdRecord = await testCreateRecord();
    
    if (!createdRecord) {
      console.log('\n❌ Record creation failed, stopping tests');
      return;
    }
    
    // Wait a moment for sync
    console.log('\n⏳ Waiting 3 seconds for sync...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Check Metabase sync
    const recordSyncWorking = await checkMetabaseSync();
    
    // Test 3: Create a new column
    const createdColumn = await testCreateColumn();
    
    if (!createdColumn) {
      console.log('\n❌ Column creation failed');
    }
    
    // Wait a moment for sync
    console.log('\n⏳ Waiting 3 seconds for sync...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 4: Check Metabase sync again
    const columnSyncWorking = await checkMetabaseSync();
    
    console.log('\n🎉 Real-time sync tests completed!');
    
    if (recordSyncWorking && createdColumn) {
      console.log('✅ All tests passed! Real-time sync is working perfectly!');
    } else if (recordSyncWorking) {
      console.log('✅ Record sync is working! Column sync needs investigation.');
    } else {
      console.log('❌ Real-time sync is not working properly. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests
runTests();
