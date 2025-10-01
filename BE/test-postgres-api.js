import axios from 'axios';

console.log('🧪 Testing PostgreSQL API...');
console.log('============================');

async function testPostgresAPI() {
  try {
    // Test basic API
    console.log('🔄 Testing basic API...');
    const basicResponse = await axios.get('http://localhost:3004/api');
    console.log('✅ Basic API:', basicResponse.data.message);

    // Test health endpoint
    console.log('🔄 Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3004/api/health');
    console.log('✅ Health:', healthResponse.data.status);

    // Test database tables endpoint (should now use PostgreSQL)
    console.log('🔄 Testing database tables endpoint...');
    try {
      const tablesResponse = await axios.get('http://localhost:3004/api/database/databases/68d792d5d5ea0d015b6b0170/tables');
      console.log('✅ Database tables endpoint working');
      console.log(`   Found ${tablesResponse.data.data.length} tables`);
      
      // Check if Postgres table is in the response
      const postgresTable = tablesResponse.data.data.find(table => table.name === 'Postgres');
      if (postgresTable) {
        console.log('✅ Postgres table found in response');
        console.log(`   Table ID: ${postgresTable._id}`);
        console.log(`   Database ID: ${postgresTable.databaseId}`);
      } else {
        console.log('❌ Postgres table not found in response');
      }
    } catch (error) {
      console.log('❌ Database tables endpoint error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test table records endpoint (should now use PostgreSQL)
    console.log('🔄 Testing table records endpoint...');
    try {
      const recordsResponse = await axios.get('http://localhost:3004/api/database/tables/68d792fbd5ea0d015b6b053f/records');
      console.log('✅ Table records endpoint working');
      console.log(`   Found ${recordsResponse.data.data.length} records`);
      
      // Check if records have data
      if (recordsResponse.data.data.length > 0) {
        const firstRecord = recordsResponse.data.data[0];
        console.log('✅ Records have data');
        console.log(`   First record data: ${JSON.stringify(firstRecord.data)}`);
      }
    } catch (error) {
      console.log('❌ Table records endpoint error:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n🎉 PostgreSQL API test completed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testPostgresAPI().catch(console.error);

