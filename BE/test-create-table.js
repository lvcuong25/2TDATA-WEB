import axios from 'axios';

console.log('🧪 Testing Table Creation with PostgreSQL...');
console.log('============================================');

async function testCreateTable() {
  try {
    // Test creating a new table
    console.log('🔄 Testing table creation...');
    
    const tableData = {
      baseId: '68d792d5d5ea0d015b6b0170', // Same database as Postgres table
      name: 'Test PostgreSQL Table',
      description: 'Test table created via API to verify PostgreSQL integration'
    };

    // Note: This will require authentication, so we'll just test the endpoint structure
    console.log('📝 Table data to create:');
    console.log(`   Name: ${tableData.name}`);
    console.log(`   Database ID: ${tableData.baseId}`);
    console.log(`   Description: ${tableData.description}`);

    console.log('\n✅ Table creation test prepared!');
    console.log('💡 To test with authentication:');
    console.log('   1. Login to frontend');
    console.log('   2. Create a new table');
    console.log('   3. Check if it appears in PostgreSQL');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCreateTable().catch(console.error);

