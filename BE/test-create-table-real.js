import axios from 'axios';

console.log('🧪 Testing Real Table Creation...');
console.log('=================================');

async function testCreateTableReal() {
  try {
    // Test creating a new table via API
    console.log('🔄 Testing table creation via API...');
    
    const tableData = {
      baseId: '68d792d5d5ea0d015b6b0170',
      name: 'Test Real Table',
      description: 'Test table created via API to verify PostgreSQL integration'
    };

    console.log('📝 Table data to create:');
    console.log(`   Name: ${tableData.name}`);
    console.log(`   Database ID: ${tableData.baseId}`);

    // Create table via API
    try {
      const response = await axios.post('http://localhost:3004/api/database/tables', tableData);
      console.log('✅ Table created successfully!');
      console.log(`   Table ID: ${response.data.data._id}`);
      console.log(`   Table Name: ${response.data.data.name}`);
      
      // Wait a moment for the database to be updated
      console.log('⏳ Waiting for database update...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if table appears in PostgreSQL
      console.log('🔄 Checking PostgreSQL...');
      const { Table } = await import('./src/models/postgres/index.js');
      const { hybridDbManager } = await import('./src/config/hybrid-db.js');
      
      await hybridDbManager.connectAll();
      
      const postgresTable = await Table.findByPk(response.data.data._id);
      if (postgresTable) {
        console.log('✅ Table found in PostgreSQL!');
        console.log(`   PostgreSQL ID: ${postgresTable.id}`);
        console.log(`   PostgreSQL Name: ${postgresTable.name}`);
      } else {
        console.log('❌ Table not found in PostgreSQL');
      }
      
      await hybridDbManager.disconnectAll();
      
    } catch (error) {
      console.log('❌ API error:', error.response?.status, error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCreateTableReal().catch(console.error);

