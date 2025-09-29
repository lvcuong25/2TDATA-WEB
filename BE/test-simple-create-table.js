import { Table as PostgresTable } from './src/models/postgres/index.js';
import { hybridDbManager } from './src/config/hybrid-db.js';

console.log('🧪 Testing Simple Table Creation...');
console.log('===================================');

async function testSimpleCreateTable() {
  try {
    // Connect to hybrid database system
    console.log('🔄 Connecting to databases...');
    await hybridDbManager.connectAll();
    console.log('✅ Connected to databases');

    // Test creating a table directly in PostgreSQL
    console.log('🔄 Creating test table...');
    
    const testTable = await PostgresTable.create({
      name: 'Test Simple Table',
      description: 'Test table created directly in PostgreSQL',
      database_id: '68d792d5d5ea0d015b6b0170',
      user_id: '68341e4d3f86f9c7ae46e962',
      site_id: '686d45a89a0a0c37366567c8',
      table_access_rule: {
        userIds: [],
        allUsers: false,
        access: []
      },
      column_access_rules: [],
      record_access_rules: [],
      cell_access_rules: []
    });

    console.log('✅ Test table created successfully!');
    console.log(`   Table ID: ${testTable.id}`);
    console.log(`   Table Name: ${testTable.name}`);
    console.log(`   Database ID: ${testTable.database_id}`);

    // Clean up - delete the test table
    console.log('🧹 Cleaning up test table...');
    await testTable.destroy();
    console.log('✅ Test table cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await hybridDbManager.disconnectAll();
  }
}

testSimpleCreateTable().catch(console.error);
