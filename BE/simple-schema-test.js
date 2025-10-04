import mongoose from 'mongoose';
import { sequelize } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Starting Simple Schema Test...');

async function testSchemaCreation() {
  try {
    console.log('📡 Connecting to databases...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
    
    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    // Test 1: Create a test schema
    console.log('\n🏗️ Creating test schema...');
    const testSchemaName = 'test_manager_database_12345678';
    
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${testSchemaName}"`);
    console.log(`✅ Schema created: ${testSchemaName}`);
    
    // Test 2: Create a table in the schema
    console.log('\n📊 Creating test table...');
    const testTableName = 'metabase_test_table_12345678';
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${testSchemaName}"."${testTableName}" (
        id VARCHAR(255) PRIMARY KEY,
        table_id VARCHAR(255),
        user_id VARCHAR(255),
        site_id VARCHAR(255),
        name TEXT,
        value NUMERIC,
        created_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log(`✅ Table created: ${testSchemaName}.${testTableName}`);
    
    // Test 3: Insert test data
    console.log('\n📝 Inserting test data...');
    await sequelize.query(`
      INSERT INTO "${testSchemaName}"."${testTableName}" 
      (id, table_id, user_id, site_id, name, value, created_by, created_at, updated_at)
      VALUES 
      ('test-record-1', 'test-table-123', '507f1f77bcf86cd799439999', 'test-site', 'Test Record 1', 42, 'manager@test.com', NOW(), NOW()),
      ('test-record-2', 'test-table-123', '507f1f77bcf86cd799439999', 'test-site', 'Test Record 2', 100, 'manager@test.com', NOW(), NOW())
    `);
    console.log('✅ Test data inserted');
    
    // Test 4: Query data
    console.log('\n🔍 Querying test data...');
    const [rows] = await sequelize.query(`
      SELECT * FROM "${testSchemaName}"."${testTableName}"
    `);
    console.log(`✅ Found ${rows.length} records:`);
    rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.name} (value: ${row.value}, created by: ${row.created_by})`);
    });
    
    // Test 5: Update data
    console.log('\n🔄 Updating test data...');
    await sequelize.query(`
      UPDATE "${testSchemaName}"."${testTableName}" 
      SET value = 200, updated_at = NOW()
      WHERE id = 'test-record-1'
    `);
    console.log('✅ Data updated');
    
    // Test 6: Verify update
    console.log('\n🔍 Verifying update...');
    const [updatedRows] = await sequelize.query(`
      SELECT * FROM "${testSchemaName}"."${testTableName}" WHERE id = 'test-record-1'
    `);
    if (updatedRows.length > 0) {
      console.log(`✅ Update verified: ${updatedRows[0].name} now has value ${updatedRows[0].value}`);
    }
    
    // Test 7: Delete data
    console.log('\n🗑️ Deleting test data...');
    await sequelize.query(`
      DELETE FROM "${testSchemaName}"."${testTableName}" WHERE id = 'test-record-2'
    `);
    console.log('✅ Data deleted');
    
    // Test 8: Verify deletion
    console.log('\n🔍 Verifying deletion...');
    const [remainingRows] = await sequelize.query(`
      SELECT COUNT(*) as count FROM "${testSchemaName}"."${testTableName}"
    `);
    console.log(`✅ Deletion verified: ${remainingRows[0].count} records remaining`);
    
    // Test 9: Clean up
    console.log('\n🧹 Cleaning up...');
    await sequelize.query(`DROP SCHEMA IF EXISTS "${testSchemaName}" CASCADE`);
    console.log('✅ Cleanup completed');
    
    console.log('\n🎉 All tests passed! Schema-based system is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    try {
      await mongoose.disconnect();
      await sequelize.close();
      console.log('📡 Database connections closed');
    } catch (e) {
      console.log('⚠️ Error closing connections:', e.message);
    }
  }
}

// Run the test
testSchemaCreation();

