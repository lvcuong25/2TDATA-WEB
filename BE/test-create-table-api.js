import axios from 'axios';

console.log('🧪 Testing Create Table API...');
console.log('==============================');

async function testCreateTableAPI() {
  try {
    // Test creating a new table via API
    console.log('🔄 Testing table creation via API...');
    
    const tableData = {
      baseId: '68d792d5d5ea0d015b6b0170',
      name: 'Test API Table',
      description: 'Test table created via API'
    };

    console.log('📝 Table data to create:');
    console.log(`   Name: ${tableData.name}`);
    console.log(`   Database ID: ${tableData.baseId}`);

    // Note: This will require authentication, so we'll just test the endpoint structure
    console.log('\n✅ API test prepared!');
    console.log('💡 To test with authentication:');
    console.log('   1. Login to frontend');
    console.log('   2. Create a new table');
    console.log('   3. Check if it appears in PostgreSQL');

    // Test the simple routes
    console.log('\n🔄 Testing simple routes...');
    try {
      const response = await axios.get('http://localhost:3004/api/database/databases/68d792d5d5ea0d015b6b0170/tables');
      console.log('✅ Simple routes working');
      console.log(`   Found ${response.data.data.length} tables`);
    } catch (error) {
      console.log('❌ Simple routes error:', error.response?.status, error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCreateTableAPI().catch(console.error);

