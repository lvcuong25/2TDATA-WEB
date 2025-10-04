import mongoose from 'mongoose';
import { sequelize } from './src/models/postgres/index.js';
import { createDatabaseSchema, getDatabaseSchema, deleteDatabaseSchema, listDatabaseSchemas } from './src/services/schemaManager.js';
import { createMetabaseTable, updateMetabaseTable } from './src/utils/metabaseTableCreator.js';
import dotenv from 'dotenv';

dotenv.config();

// Set environment variables for PostgreSQL
process.env.PG_DATABASE = process.env.POSTGRES_DB;
process.env.PG_USER = process.env.POSTGRES_USER;
process.env.PG_PASSWORD = process.env.POSTGRES_PASSWORD;
process.env.PG_HOST = process.env.POSTGRES_HOST;
process.env.PG_PORT = process.env.POSTGRES_PORT;

// Connect to databases
const connectDatabases = async () => {
  try {
    // MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ Connected to MongoDB');
    
    // PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

// Test user credentials
const TEST_USER = {
  email: 'manager@test.com',
  password: 'Manager123',
  name: 'Test Manager'
};

// Simulate base creation with schema
const testCreateBase = async () => {
  console.log('🧪 Testing Base Creation with Schema...\n');
  
  try {
    // Simulate user data (normally would come from authentication)
    const testUserId = '507f1f77bcf86cd799439999';
    const testBaseId = '507f1f77bcf86cd799439888';
    const testBaseName = 'Test Manager Database';
    
    console.log(`📝 Creating base: ${testBaseName}`);
    console.log(`👤 Creator: ${TEST_USER.name} (${TEST_USER.email})`);
    console.log(`🆔 Base ID: ${testBaseId}`);
    
    // Step 1: Create schema for the base
    console.log('\nStep 1: Creating PostgreSQL schema...');
    const schemaResult = await createDatabaseSchema(testBaseId, testUserId);
    
    if (schemaResult.success) {
      console.log(`✅ Schema created successfully: ${schemaResult.schemaName}`);
      console.log(`   Creator: ${schemaResult.creator.name}`);
      console.log(`   Database: ${schemaResult.database.name}`);
      console.log(`   Is New: ${schemaResult.isNew}`);
    } else {
      console.log(`❌ Schema creation failed: ${schemaResult.error}`);
      return null;
    }
    
    // Step 2: Verify schema exists
    console.log('\nStep 2: Verifying schema...');
    const retrievedSchema = await getDatabaseSchema(testBaseId);
    
    if (retrievedSchema) {
      console.log(`✅ Schema retrieved: ${retrievedSchema}`);
    } else {
      console.log(`❌ Schema retrieval failed`);
      return null;
    }
    
    // Step 3: Create a test table in the schema
    console.log('\nStep 3: Creating test table in schema...');
    const tableResult = await createMetabaseTable(
      'test-table-123',
      'Test Table',
      'test-org',
      testBaseId
    );
    
    if (tableResult.success) {
      console.log(`✅ Table created: ${tableResult.fullTableName}`);
      console.log(`   Schema: ${tableResult.schemaName}`);
      console.log(`   Table: ${tableResult.metabaseTableName}`);
    } else {
      console.log(`❌ Table creation failed: ${tableResult.error}`);
    }
    
    // Step 4: Test real-time sync
    console.log('\nStep 4: Testing real-time sync...');
    const testRecord = {
      id: 'test-record-001',
      table_id: 'test-table-123',
      user_id: testUserId,
      site_id: 'test-site',
      data: {
        name: 'Test Record',
        value: 42,
        created_by: TEST_USER.email
      },
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const syncResult = await updateMetabaseTable(
      'test-table-123',
      testRecord,
      'insert',
      [],
      testBaseId
    );
    
    if (syncResult.success) {
      console.log(`✅ Real-time sync successful: ${syncResult.fullTableName}`);
    } else {
      console.log(`❌ Real-time sync failed: ${syncResult.error}`);
    }
    
    // Step 5: Verify data in schema
    console.log('\nStep 5: Verifying data in schema...');
    const [rows] = await sequelize.query(`
      SELECT * FROM "${schemaResult.schemaName}"."${tableResult.metabaseTableName}"
    `);
    
    console.log(`✅ Found ${rows.length} records in table`);
    if (rows.length > 0) {
      console.log(`   Sample record:`, {
        id: rows[0].id,
        name: rows[0].name,
        value: rows[0].value,
        created_by: rows[0].created_by
      });
    }
    
    return {
      baseId: testBaseId,
      baseName: testBaseName,
      schemaName: schemaResult.schemaName,
      tableName: tableResult.metabaseTableName,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Base creation test failed:', error);
    return null;
  }
};

// Test base update (simulate schema operations)
const testUpdateBase = async (baseInfo) => {
  console.log('\n🧪 Testing Base Update Operations...\n');
  
  try {
    if (!baseInfo) {
      console.log('❌ No base info provided for update test');
      return null;
    }
    
    console.log(`📝 Updating base: ${baseInfo.baseName}`);
    console.log(`🆔 Base ID: ${baseInfo.baseId}`);
    console.log(`📁 Schema: ${baseInfo.schemaName}`);
    
    // Step 1: Add more tables to the schema
    console.log('\nStep 1: Adding more tables to schema...');
    const additionalTables = [
      { id: 'table-2', name: 'Users' },
      { id: 'table-3', name: 'Products' }
    ];
    
    const tableResults = [];
    for (const table of additionalTables) {
      const result = await createMetabaseTable(
        table.id,
        table.name,
        'test-org',
        baseInfo.baseId
      );
      
      if (result.success) {
        console.log(`   ✅ Created table: ${result.fullTableName}`);
        tableResults.push(result);
      } else {
        console.log(`   ❌ Failed to create table ${table.name}: ${result.error}`);
      }
    }
    
    // Step 2: Add records to new tables
    console.log('\nStep 2: Adding records to new tables...');
    for (const tableResult of tableResults) {
      const testRecord = {
        id: `record-${tableResult.metabaseTableName}-1`,
        table_id: tableResult.metabaseTableName.split('_')[2],
        user_id: '507f1f77bcf86cd799439999',
        site_id: 'test-site',
        data: {
          name: `Test ${tableResult.metabaseTableName}`,
          created_by: TEST_USER.email,
          updated_at: new Date().toISOString()
        },
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const syncResult = await updateMetabaseTable(
        testRecord.table_id,
        testRecord,
        'insert',
        [],
        baseInfo.baseId
      );
      
      if (syncResult.success) {
        console.log(`   ✅ Added record to: ${syncResult.fullTableName}`);
      } else {
        console.log(`   ❌ Failed to add record: ${syncResult.error}`);
      }
    }
    
    // Step 3: Test update operations
    console.log('\nStep 3: Testing update operations...');
    const updateRecord = {
      id: 'test-record-001',
      table_id: 'test-table-123',
      user_id: '507f1f77bcf86cd799439999',
      site_id: 'test-site',
      data: {
        name: 'Updated Test Record',
        value: 100,
        created_by: TEST_USER.email,
        updated_by: TEST_USER.email
      },
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const updateResult = await updateMetabaseTable(
      'test-table-123',
      updateRecord,
      'update',
      [],
      baseInfo.baseId
    );
    
    if (updateResult.success) {
      console.log(`✅ Update successful: ${updateResult.fullTableName}`);
    } else {
      console.log(`❌ Update failed: ${updateResult.error}`);
    }
    
    // Step 4: Verify schema state
    console.log('\nStep 4: Verifying schema state...');
    const schemas = await listDatabaseSchemas();
    const currentSchema = schemas.find(s => s.schema_name === baseInfo.schemaName);
    
    if (currentSchema) {
      console.log(`✅ Schema ${currentSchema.schema_name} has ${currentSchema.tableCount} tables`);
      
      // List all tables in the schema
      const [tables] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${currentSchema.schema_name}'
        ORDER BY table_name
      `);
      
      console.log('   Tables in schema:');
      for (const table of tables) {
        const [rowCount] = await sequelize.query(`
          SELECT COUNT(*) as count 
          FROM "${currentSchema.schema_name}"."${table.table_name}"
        `);
        console.log(`     - ${table.table_name}: ${rowCount[0].count} records`);
      }
    }
    
    return {
      ...baseInfo,
      additionalTables: tableResults.length,
      totalTables: currentSchema ? currentSchema.tableCount : 0,
      updateSuccess: updateResult.success
    };
    
  } catch (error) {
    console.error('❌ Base update test failed:', error);
    return baseInfo;
  }
};

// Test base deletion (schema cleanup)
const testDeleteBase = async (baseInfo) => {
  console.log('\n🧪 Testing Base Deletion (Schema Cleanup)...\n');
  
  try {
    if (!baseInfo) {
      console.log('❌ No base info provided for deletion test');
      return null;
    }
    
    console.log(`🗑️ Deleting base: ${baseInfo.baseName}`);
    console.log(`🆔 Base ID: ${baseInfo.baseId}`);
    console.log(`📁 Schema: ${baseInfo.schemaName}`);
    
    // Step 1: Check schema state before deletion
    console.log('\nStep 1: Checking schema state before deletion...');
    const schemasBefore = await listDatabaseSchemas();
    const schemaBefore = schemasBefore.find(s => s.schema_name === baseInfo.schemaName);
    
    if (schemaBefore) {
      console.log(`✅ Schema found with ${schemaBefore.tableCount} tables`);
    } else {
      console.log(`❌ Schema not found: ${baseInfo.schemaName}`);
      return null;
    }
    
    // Step 2: Delete schema (with force to delete all tables)
    console.log('\nStep 2: Deleting schema and all tables...');
    const deleteResult = await deleteDatabaseSchema(baseInfo.baseId, true);
    
    if (deleteResult.success) {
      console.log(`✅ Schema deleted successfully: ${deleteResult.schemaName}`);
      console.log(`   Tables deleted: ${deleteResult.tableCount}`);
    } else {
      console.log(`❌ Schema deletion failed: ${deleteResult.error}`);
      return null;
    }
    
    // Step 3: Verify schema is gone
    console.log('\nStep 3: Verifying schema deletion...');
    const schemasAfter = await listDatabaseSchemas();
    const schemaAfter = schemasAfter.find(s => s.schema_name === baseInfo.schemaName);
    
    if (!schemaAfter) {
      console.log(`✅ Schema successfully removed from system`);
    } else {
      console.log(`❌ Schema still exists: ${baseInfo.schemaName}`);
    }
    
    // Step 4: Test that operations fail gracefully
    console.log('\nStep 4: Testing graceful failure of operations...');
    const testRecord = {
      id: 'test-record-001',
      table_id: 'test-table-123',
      user_id: '507f1f77bcf86cd799439999',
      site_id: 'test-site',
      data: { name: 'Test' },
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const syncResult = await updateMetabaseTable(
      'test-table-123',
      testRecord,
      'insert',
      [],
      baseInfo.baseId
    );
    
    if (!syncResult.success) {
      console.log(`✅ Operations fail gracefully: ${syncResult.error}`);
    } else {
      console.log(`❌ Operations should have failed but didn't`);
    }
    
    return {
      ...baseInfo,
      deletionSuccess: deleteResult.success,
      tablesDeleted: deleteResult.tableCount
    };
    
  } catch (error) {
    console.error('❌ Base deletion test failed:', error);
    return baseInfo;
  }
};

// Main test runner
const runBaseSchemaTests = async () => {
  try {
    console.log('🚀 Starting Base Schema Operations Test...\n');
    console.log(`👤 Test User: ${TEST_USER.name} (${TEST_USER.email})`);
    console.log('=' * 60);
    
    await connectDatabases();
    
    // Test 1: Create Base with Schema
    const baseInfo = await testCreateBase();
    
    if (!baseInfo) {
      console.log('\n❌ Base creation failed, stopping tests');
      return;
    }
    
    // Test 2: Update Base (add tables, records)
    const updatedBaseInfo = await testUpdateBase(baseInfo);
    
    // Test 3: Delete Base (cleanup schema)
    const finalResult = await testDeleteBase(updatedBaseInfo);
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('=' * 60);
    console.log(`✅ Base Creation: ${baseInfo ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Base Update: ${updatedBaseInfo ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Base Deletion: ${finalResult?.deletionSuccess ? 'SUCCESS' : 'FAILED'}`);
    
    if (finalResult) {
      console.log(`\n📈 Results:`);
      console.log(`   - Schema Created: ${finalResult.schemaName}`);
      console.log(`   - Tables Created: ${finalResult.totalTables || 0}`);
      console.log(`   - Tables Deleted: ${finalResult.tablesDeleted || 0}`);
      console.log(`   - Update Operations: ${finalResult.updateSuccess ? 'SUCCESS' : 'FAILED'}`);
    }
    
    console.log('\n🎉 Base Schema Operations Test Completed!');
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
    process.exit(0);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBaseSchemaTests();
}

export { testCreateBase, testUpdateBase, testDeleteBase, runBaseSchemaTests };

