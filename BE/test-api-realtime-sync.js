import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

console.log('🧪 Testing API real-time sync...\n');

// Test data
const testTableId = 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380'; // postgresX table
const testUserId = '68341e4d3f86f9c7ae46e962';
const testSiteId = '686d45a89a0a0c37366567c8';

const testRecord = {
  data: {
    'Tên': 'Test User',
    'Tuổi': '25',
    'Ngày sinh': '1999-01-01',
    'Địa chỉ': 'Test Address'
  }
};

async function testCreateRecord() {
  try {
    console.log('🔄 Testing create record API...');
    console.log(`   Table ID: ${testTableId}`);
    console.log(`   Record data:`, testRecord.data);
    
    const response = await axios.post(
      `${API_BASE_URL}/database/records`,
      {
        ...testRecord,
        tableId: testTableId
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-site-id': testSiteId
        }
      }
    );
    
    if (response.status === 200 || response.status === 201) {
      console.log('   ✅ Create record API successful');
      console.log(`   Response:`, response.data);
      return response.data;
    } else {
      console.log('   ❌ Create record API failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, response.data);
      return null;
    }
  } catch (error) {
    console.log('   ❌ Create record API error:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function testCreateColumn() {
  try {
    console.log('\n🔄 Testing create column API...');
    
    const testColumn = {
      name: 'Test Column',
      key: 'test_column',
      dataType: 'text',
      isRequired: false,
      isUnique: false
    };
    
    console.log(`   Table ID: ${testTableId}`);
    console.log(`   Column data:`, testColumn);
    
    const response = await axios.post(
      `${API_BASE_URL}/database/columns`,
      {
        ...testColumn,
        tableId: testTableId
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-site-id': testSiteId
        }
      }
    );
    
    if (response.status === 200 || response.status === 201) {
      console.log('   ✅ Create column API successful');
      console.log(`   Response:`, response.data);
      return response.data;
    } else {
      console.log('   ❌ Create column API failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, response.data);
      return null;
    }
  } catch (error) {
    console.log('   ❌ Create column API error:');
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
      where: { table_id: testTableId },
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    console.log(`   Found ${records.length} recent records in PostgreSQL`);
    
    // Check Metabase table
    const expectedMetabaseTableName = `metabase_postgresx_${testTableId.slice(-8)}`;
    const [metabaseRecords] = await sequelize.query(`SELECT COUNT(*) as count FROM "${expectedMetabaseTableName}"`);
    
    console.log(`   Found ${metabaseRecords[0].count} records in Metabase table`);
    
    if (records.length > 0 && metabaseRecords[0].count >= records.length) {
      console.log('   ✅ Metabase sync appears to be working');
    } else {
      console.log('   ❌ Metabase sync may not be working properly');
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.log('   ❌ Error checking Metabase sync:', error.message);
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting API real-time sync tests...\n');
    
    // Test 1: Create a new record
    const createdRecord = await testCreateRecord();
    
    // Wait a moment for sync
    console.log('\n⏳ Waiting 2 seconds for sync...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Check Metabase sync
    await checkMetabaseSync();
    
    // Test 3: Create a new column
    const createdColumn = await testCreateColumn();
    
    // Wait a moment for sync
    console.log('\n⏳ Waiting 2 seconds for sync...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Check Metabase sync again
    await checkMetabaseSync();
    
    console.log('\n🎉 API real-time sync tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests
runTests();
