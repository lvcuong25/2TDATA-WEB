import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

console.log('🧪 Testing server logs for Metabase sync...\n');

async function testCreateRecordWithLogs() {
  try {
    console.log('🔄 Creating record and watching for server logs...');
    
    const testRecord = {
      tableId: 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380',
      data: {
        'Tên': 'Server Log Test User',
        'Tuổi': '35',
        'Ngày sinh': '1989-01-01',
        'Địa chỉ': 'Server Log Test Address'
      }
    };
    
    console.log(`   Record data:`, testRecord);
    console.log('   📝 Watch the server console for Metabase sync logs...');
    
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
    console.log(`   Record ID: ${response.data.data._id}`);
    
    // Wait a moment for sync
    console.log('\n⏳ Waiting 2 seconds for sync...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return response.data;
  } catch (error) {
    console.log('   ❌ Create record API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function checkMetabaseSync() {
  try {
    console.log('\n🔍 Checking Metabase sync...');
    
    // Import PostgreSQL models to check
    const { sequelize, Record } = await import('./src/models/postgres/index.js');
    
    // Get latest records
    const records = await Record.findAll({ 
      where: { table_id: 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380' },
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
      console.log(`   Missing ${records.length - metabaseRecords[0].count} records`);
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Error checking Metabase sync:', error.message);
    return false;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting server logs test...\n');
    
    // Test 1: Create a new record and watch for logs
    const createdRecord = await testCreateRecordWithLogs();
    
    if (!createdRecord) {
      console.log('\n❌ Record creation failed, stopping tests');
      return;
    }
    
    // Test 2: Check Metabase sync
    const syncWorking = await checkMetabaseSync();
    
    console.log('\n🎉 Server logs test completed!');
    
    if (syncWorking) {
      console.log('✅ Metabase sync is working!');
    } else {
      console.log('❌ Metabase sync is not working properly.');
      console.log('📝 Check the server console logs for any Metabase sync errors.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests
runTests();
