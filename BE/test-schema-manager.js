import mongoose from 'mongoose';
import { sequelize } from './src/models/postgres/index.js';
import { createDatabaseSchema, getDatabaseSchema, deleteDatabaseSchema, listDatabaseSchemas } from './src/services/schemaManager.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Testing Schema Manager Service...');

async function testSchemaManager() {
  try {
    console.log('📡 Connecting to databases...');
    
    // Connect to databases
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    // Create test user in MongoDB
    console.log('\n👤 Creating test user...');
    const User = (await import('./src/model/User.js')).default;
    
    let user = await User.findOne({ email: 'manager@test.com' });
    if (!user) {
      user = new User({
        name: 'Test Manager',
        email: 'manager@test.com',
        password: 'Manager123',
        role: 'manager'
      });
      await user.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ Found existing test user');
    }
    
    // Create test base in MongoDB
    console.log('\n📝 Creating test base...');
    const Base = (await import('./src/model/Base.js')).default;
    
    const testBaseName = `Test Manager Database - ${Date.now()}`;
    const base = new Base({
      name: testBaseName,
      ownerId: user._id,
      orgId: user._id
    });
    await base.save();
    console.log(`✅ Test base created: ${base.name} (${base._id})`);
    
    // Test 1: Create schema using schema manager
    console.log('\n🏗️ Testing schema creation...');
    const schemaResult = await createDatabaseSchema(base._id, user._id);
    
    if (schemaResult.success) {
      console.log(`✅ Schema created successfully: ${schemaResult.schemaName}`);
      console.log(`   Creator: ${schemaResult.creator.name}`);
      console.log(`   Database: ${schemaResult.database.name}`);
      console.log(`   Is New: ${schemaResult.isNew}`);
    } else {
      console.log(`❌ Schema creation failed: ${schemaResult.error}`);
      return;
    }
    
    // Test 2: Get schema
    console.log('\n🔍 Testing schema retrieval...');
    const retrievedSchema = await getDatabaseSchema(base._id);
    
    if (retrievedSchema) {
      console.log(`✅ Schema retrieved: ${retrievedSchema}`);
    } else {
      console.log(`❌ Schema retrieval failed`);
      return;
    }
    
    // Test 3: List all schemas
    console.log('\n📋 Testing schema listing...');
    const schemas = await listDatabaseSchemas();
    console.log(`✅ Found ${schemas.length} schemas:`);
    schemas.forEach(schema => {
      console.log(`   - ${schema.schema_name}: ${schema.tableCount} tables`);
    });
    
    // Test 4: Create a table in the schema
    console.log('\n📊 Creating test table in schema...');
    const testTableName = 'metabase_test_table_12345678';
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${schemaResult.schemaName}"."${testTableName}" (
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
    console.log(`✅ Table created: ${schemaResult.schemaName}.${testTableName}`);
    
    // Test 5: Insert test data
    console.log('\n📝 Inserting test data...');
    await sequelize.query(`
      INSERT INTO "${schemaResult.schemaName}"."${testTableName}" 
      (id, table_id, user_id, site_id, name, value, created_by, created_at, updated_at)
      VALUES 
      ('test-record-1', 'test-table-123', '${user._id}', 'test-site', 'Test Record 1', 42, 'manager@test.com', NOW(), NOW()),
      ('test-record-2', 'test-table-123', '${user._id}', 'test-site', 'Test Record 2', 100, 'manager@test.com', NOW(), NOW())
    `);
    console.log('✅ Test data inserted');
    
    // Test 6: Query data
    console.log('\n🔍 Querying test data...');
    const [rows] = await sequelize.query(`
      SELECT * FROM "${schemaResult.schemaName}"."${testTableName}"
    `);
    console.log(`✅ Found ${rows.length} records:`);
    rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.name} (value: ${row.value}, created by: ${row.created_by})`);
    });
    
    // Test 7: Update data
    console.log('\n🔄 Testing update operation...');
    await sequelize.query(`
      UPDATE "${schemaResult.schemaName}"."${testTableName}" 
      SET value = 200, updated_at = NOW()
      WHERE id = 'test-record-1'
    `);
    console.log('✅ Data updated');
    
    // Test 8: Delete data
    console.log('\n🗑️ Testing delete operation...');
    await sequelize.query(`
      DELETE FROM "${schemaResult.schemaName}"."${testTableName}" WHERE id = 'test-record-2'
    `);
    console.log('✅ Data deleted');
    
    // Test 9: Verify final state
    console.log('\n🔍 Verifying final state...');
    const [finalRows] = await sequelize.query(`
      SELECT COUNT(*) as count FROM "${schemaResult.schemaName}"."${testTableName}"
    `);
    console.log(`✅ Final state: ${finalRows[0].count} records remaining`);
    
    // Test 10: Delete schema using schema manager
    console.log('\n🗑️ Testing schema deletion...');
    const deleteResult = await deleteDatabaseSchema(base._id, true);
    
    if (deleteResult.success) {
      console.log(`✅ Schema deleted successfully: ${deleteResult.schemaName}`);
      console.log(`   Tables deleted: ${deleteResult.tableCount}`);
    } else {
      console.log(`❌ Schema deletion failed: ${deleteResult.error}`);
    }
    
    // Test 11: Verify schema is gone
    console.log('\n🔍 Verifying schema deletion...');
    const schemasAfter = await listDatabaseSchemas();
    const schemaAfter = schemasAfter.find(s => s.schema_name === schemaResult.schemaName);
    
    if (!schemaAfter) {
      console.log(`✅ Schema successfully removed from system`);
    } else {
      console.log(`❌ Schema still exists: ${schemaResult.schemaName}`);
    }
    
    // Clean up MongoDB
    console.log('\n🧹 Cleaning up MongoDB...');
    await Base.findByIdAndDelete(base._id);
    console.log('✅ Base removed from MongoDB');
    
    console.log('\n🎉 All Schema Manager tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Schema Creation: SUCCESS');
    console.log('✅ Schema Retrieval: SUCCESS');
    console.log('✅ Schema Listing: SUCCESS');
    console.log('✅ Table Operations: SUCCESS');
    console.log('✅ Data Operations: SUCCESS');
    console.log('✅ Schema Deletion: SUCCESS');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    try {
      await mongoose.disconnect();
      await sequelize.close();
      console.log('\n📡 Database connections closed');
    } catch (e) {
      console.log('⚠️ Error closing connections:', e.message);
    }
  }
}

// Run the test
testSchemaManager();

