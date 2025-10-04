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

// Find or create test user
const findOrCreateTestUser = async () => {
  try {
    const User = (await import('./src/model/User.js')).default;
    
    // Try to find existing user
    let user = await User.findOne({ email: 'manager@test.com' });
    
    if (!user) {
      console.log('👤 Creating test user: manager@test.com');
      user = new User({
        name: 'Test Manager',
        email: 'manager@test.com',
        password: 'Manager123', // This would be hashed in real scenario
        role: 'manager'
      });
      await user.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ Found existing test user:', user.name);
    }
    
    return user;
  } catch (error) {
    console.error('❌ Error with test user:', error.message);
    return null;
  }
};

// Test creating a real base with schema
const testCreateRealBase = async () => {
  console.log('🧪 Testing Real Base Creation with Schema...\n');
  
  try {
    // Step 1: Get or create test user
    const user = await findOrCreateTestUser();
    if (!user) {
      console.log('❌ Could not get test user');
      return null;
    }
    
    console.log(`👤 Using user: ${user.name} (${user.email})`);
    console.log(`🆔 User ID: ${user._id}`);
    
    // Step 2: Create a test base/database
    const Base = (await import('./src/model/Base.js')).default;
    const testBaseName = `Test Manager Database - ${new Date().toISOString()}`;
    
    console.log(`\n📝 Creating base: ${testBaseName}`);
    
    const base = new Base({
      name: testBaseName,
      ownerId: user._id,
      orgId: user._id // Using user ID as org ID for simplicity
    });
    
    await base.save();
    console.log(`✅ Base created with ID: ${base._id}`);
    
    // Step 3: Create schema for the base
    console.log('\n🏗️ Creating PostgreSQL schema...');
    const schemaResult = await createDatabaseSchema(base._id, user._id);
    
    if (schemaResult.success) {
      console.log(`✅ Schema created: ${schemaResult.schemaName}`);
      console.log(`   Creator: ${schemaResult.creator.name}`);
      console.log(`   Database: ${schemaResult.database.name}`);
    } else {
      console.log(`❌ Schema creation failed: ${schemaResult.error}`);
      return null;
    }
    
    // Step 4: Create a test table in the schema
    console.log('\n📊 Creating test table in schema...');
    const tableResult = await createMetabaseTable(
      'test-table-real',
      'Test Table',
      'test-org',
      base._id
    );
    
    if (tableResult.success) {
      console.log(`✅ Table created: ${tableResult.fullTableName}`);
    } else {
      console.log(`❌ Table creation failed: ${tableResult.error}`);
    }
    
    // Step 5: Test real-time sync
    console.log('\n🔄 Testing real-time sync...');
    const testRecord = {
      id: 'test-record-real-001',
      table_id: 'test-table-real',
      user_id: user._id,
      site_id: 'test-site',
      data: {
        name: 'Real Test Record',
        value: 42,
        created_by: user.email,
        created_at: new Date().toISOString()
      },
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const syncResult = await updateMetabaseTable(
      'test-table-real',
      testRecord,
      'insert',
      [],
      base._id
    );
    
    if (syncResult.success) {
      console.log(`✅ Real-time sync successful: ${syncResult.fullTableName}`);
    } else {
      console.log(`❌ Real-time sync failed: ${syncResult.error}`);
    }
    
    // Step 6: Verify data
    console.log('\n🔍 Verifying data in schema...');
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
      baseId: base._id,
      baseName: testBaseName,
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      schemaName: schemaResult.schemaName,
      tableName: tableResult.metabaseTableName,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Real base creation test failed:', error);
    return null;
  }
};

// Test updating the base
const testUpdateRealBase = async (baseInfo) => {
  console.log('\n🧪 Testing Real Base Update Operations...\n');
  
  try {
    if (!baseInfo) {
      console.log('❌ No base info provided for update test');
      return null;
    }
    
    console.log(`📝 Updating base: ${baseInfo.baseName}`);
    console.log(`👤 User: ${baseInfo.userName} (${baseInfo.userEmail})`);
    console.log(`📁 Schema: ${baseInfo.schemaName}`);
    
    // Step 1: Add more tables
    console.log('\n📊 Adding more tables to schema...');
    const additionalTables = [
      { id: 'users-table', name: 'Users' },
      { id: 'products-table', name: 'Products' }
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
    console.log('\n📝 Adding records to new tables...');
    for (const tableResult of tableResults) {
      const testRecord = {
        id: `record-${tableResult.metabaseTableName}-1`,
        table_id: tableResult.metabaseTableName.split('_')[2],
        user_id: baseInfo.userId,
        site_id: 'test-site',
        data: {
          name: `Test ${tableResult.metabaseTableName}`,
          created_by: baseInfo.userEmail,
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
    
    // Step 3: Test update operation
    console.log('\n🔄 Testing update operation...');
    const updateRecord = {
      id: 'test-record-real-001',
      table_id: 'test-table-real',
      user_id: baseInfo.userId,
      site_id: 'test-site',
      data: {
        name: 'Updated Real Test Record',
        value: 100,
        created_by: baseInfo.userEmail,
        updated_by: baseInfo.userEmail,
        updated_at: new Date().toISOString()
      },
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const updateResult = await updateMetabaseTable(
      'test-table-real',
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
    
    // Step 4: Verify final state
    console.log('\n🔍 Verifying final schema state...');
    const schemas = await listDatabaseSchemas();
    const currentSchema = schemas.find(s => s.schema_name === baseInfo.schemaName);
    
    if (currentSchema) {
      console.log(`✅ Schema ${currentSchema.schema_name} has ${currentSchema.tableCount} tables`);
      
      // List all tables with record counts
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
    console.error('❌ Real base update test failed:', error);
    return baseInfo;
  }
};

// Test deleting the base
const testDeleteRealBase = async (baseInfo) => {
  console.log('\n🧪 Testing Real Base Deletion (Schema Cleanup)...\n');
  
  try {
    if (!baseInfo) {
      console.log('❌ No base info provided for deletion test');
      return null;
    }
    
    console.log(`🗑️ Deleting base: ${baseInfo.baseName}`);
    console.log(`👤 User: ${baseInfo.userName} (${baseInfo.userEmail})`);
    console.log(`📁 Schema: ${baseInfo.schemaName}`);
    
    // Step 1: Check schema state before deletion
    console.log('\n🔍 Checking schema state before deletion...');
    const schemasBefore = await listDatabaseSchemas();
    const schemaBefore = schemasBefore.find(s => s.schema_name === baseInfo.schemaName);
    
    if (schemaBefore) {
      console.log(`✅ Schema found with ${schemaBefore.tableCount} tables`);
    } else {
      console.log(`❌ Schema not found: ${baseInfo.schemaName}`);
      return null;
    }
    
    // Step 2: Delete schema
    console.log('\n🗑️ Deleting schema and all tables...');
    const deleteResult = await deleteDatabaseSchema(baseInfo.baseId, true);
    
    if (deleteResult.success) {
      console.log(`✅ Schema deleted: ${deleteResult.schemaName}`);
      console.log(`   Tables deleted: ${deleteResult.tableCount}`);
    } else {
      console.log(`❌ Schema deletion failed: ${deleteResult.error}`);
      return null;
    }
    
    // Step 3: Verify deletion
    console.log('\n🔍 Verifying schema deletion...');
    const schemasAfter = await listDatabaseSchemas();
    const schemaAfter = schemasAfter.find(s => s.schema_name === baseInfo.schemaName);
    
    if (!schemaAfter) {
      console.log(`✅ Schema successfully removed from system`);
    } else {
      console.log(`❌ Schema still exists: ${baseInfo.schemaName}`);
    }
    
    // Step 4: Clean up base from MongoDB
    console.log('\n🧹 Cleaning up base from MongoDB...');
    const Base = (await import('./src/model/Base.js')).default;
    await Base.findByIdAndDelete(baseInfo.baseId);
    console.log('✅ Base removed from MongoDB');
    
    return {
      ...baseInfo,
      deletionSuccess: deleteResult.success,
      tablesDeleted: deleteResult.tableCount
    };
    
  } catch (error) {
    console.error('❌ Real base deletion test failed:', error);
    return baseInfo;
  }
};

// Main test runner
const runRealBaseTests = async () => {
  try {
    console.log('🚀 Starting Real Base Schema Operations Test...\n');
    console.log('👤 Test User: manager@test.com');
    console.log('=' * 60);
    
    await connectDatabases();
    
    // Test 1: Create Real Base with Schema
    const baseInfo = await testCreateRealBase();
    
    if (!baseInfo) {
      console.log('\n❌ Real base creation failed, stopping tests');
      return;
    }
    
    // Test 2: Update Real Base
    const updatedBaseInfo = await testUpdateRealBase(baseInfo);
    
    // Test 3: Delete Real Base
    const finalResult = await testDeleteRealBase(updatedBaseInfo);
    
    // Summary
    console.log('\n📊 Real Base Test Summary:');
    console.log('=' * 60);
    console.log(`✅ Base Creation: ${baseInfo ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Base Update: ${updatedBaseInfo ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Base Deletion: ${finalResult?.deletionSuccess ? 'SUCCESS' : 'FAILED'}`);
    
    if (finalResult) {
      console.log(`\n📈 Results:`);
      console.log(`   - User: ${finalResult.userName} (${finalResult.userEmail})`);
      console.log(`   - Base: ${finalResult.baseName}`);
      console.log(`   - Schema: ${finalResult.schemaName}`);
      console.log(`   - Tables Created: ${finalResult.totalTables || 0}`);
      console.log(`   - Tables Deleted: ${finalResult.tablesDeleted || 0}`);
      console.log(`   - Update Operations: ${finalResult.updateSuccess ? 'SUCCESS' : 'FAILED'}`);
    }
    
    console.log('\n🎉 Real Base Schema Operations Test Completed!');
    
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
  runRealBaseTests();
}

export { testCreateRealBase, testUpdateRealBase, testDeleteRealBase, runRealBaseTests };

