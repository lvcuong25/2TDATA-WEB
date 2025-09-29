import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

console.log('🧪 Testing final real-time sync after server restart...\n');

async function testCreateRecord() {
  try {
    console.log('🔄 Testing create record API...');
    
    const testRecord = {
      tableId: 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380',
      data: {
        'Tên': 'Final Real-time Test User',
        'Tuổi': '32',
        'Ngày sinh': '1992-01-01',
        'Địa chỉ': 'Final Real-time Test Address'
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
    console.log(`   Record ID: ${response.data.data._id}`);
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
    console.log('🚀 Starting final real-time sync test...\n');
    
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
    const syncWorking = await checkMetabaseSync();
    
    console.log('\n🎉 Final real-time sync test completed!');
    
    if (syncWorking) {
      console.log('✅ SUCCESS! Real-time Metabase sync is working perfectly!');
      console.log('🎯 The system is now ready for production use.');
    } else {
      console.log('❌ Real-time sync is still not working properly.');
      console.log('📝 Check the server console logs for any Metabase sync errors.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests
runTests();
