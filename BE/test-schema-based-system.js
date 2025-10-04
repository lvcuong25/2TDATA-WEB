import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { 
  createDatabaseSchema, 
  getDatabaseSchema, 
  deleteDatabaseSchema, 
  listDatabaseSchemas,
  generateSchemaName 
} from './src/services/schemaManager.js';
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

// Test schema name generation
const testSchemaNameGeneration = () => {
  console.log('🧪 Testing schema name generation...\n');
  
  const testCases = [
    { creator: 'John Doe', database: 'My Database', id: '507f1f77bcf86cd799439011' },
    { creator: 'Jane Smith', database: 'Test DB', id: '507f1f77bcf86cd799439012' },
    { creator: 'User@123', database: 'Database-Name', id: '507f1f77bcf86cd799439013' },
    { creator: 'Very Long Creator Name That Should Be Truncated', database: 'Very Long Database Name', id: '507f1f77bcf86cd799439014' }
  ];
  
  testCases.forEach((testCase, index) => {
    const schemaName = generateSchemaName(testCase.creator, testCase.database, testCase.id);
    console.log(`Test ${index + 1}:`);
    console.log(`  Creator: ${testCase.creator}`);
    console.log(`  Database: ${testCase.database}`);
    console.log(`  ID: ${testCase.id}`);
    console.log(`  Generated Schema: ${schemaName}`);
    console.log(`  Length: ${schemaName.length} characters\n`);
  });
};

// Test schema creation and management
const testSchemaManagement = async () => {
  console.log('🧪 Testing schema management...\n');
  
  // Create a test database ID
  const testDatabaseId = '507f1f77bcf86cd799439999';
  const testCreatorId = '507f1f77bcf86cd799439888';
  
  try {
    // Test 1: Create schema
    console.log('Test 1: Creating schema...');
    const createResult = await createDatabaseSchema(testDatabaseId, testCreatorId);
    
    if (createResult.success) {
      console.log(`✅ Schema created: ${createResult.schemaName}`);
    } else {
      console.log(`❌ Schema creation failed: ${createResult.error}`);
      return;
    }
    
    // Test 2: Get schema
    console.log('\nTest 2: Getting schema...');
    const schemaName = await getDatabaseSchema(testDatabaseId);
    
    if (schemaName) {
      console.log(`✅ Schema retrieved: ${schemaName}`);
    } else {
      console.log(`❌ Schema retrieval failed`);
      return;
    }
    
    // Test 3: List schemas
    console.log('\nTest 3: Listing schemas...');
    const schemas = await listDatabaseSchemas();
    console.log(`✅ Found ${schemas.length} schemas:`);
    schemas.forEach(schema => {
      console.log(`   - ${schema.schema_name}: ${schema.tableCount} tables`);
    });
    
    // Test 4: Clean up - delete schema
    console.log('\nTest 4: Cleaning up...');
    const deleteResult = await deleteDatabaseSchema(testDatabaseId, true);
    
    if (deleteResult.success) {
      console.log(`✅ Schema deleted: ${deleteResult.schemaName}`);
    } else {
      console.log(`❌ Schema deletion failed: ${deleteResult.error}`);
    }
    
  } catch (error) {
    console.error('❌ Schema management test failed:', error);
  }
};

// Test Metabase table creation in schema
const testMetabaseTableCreation = async () => {
  console.log('🧪 Testing Metabase table creation in schema...\n');
  
  const testDatabaseId = '507f1f77bcf86cd799439777';
  const testCreatorId = '507f1f77bcf86cd799439666';
  const testTableId = '507f1f77bcf86cd799439555';
  const testTableName = 'Test Table';
  
  try {
    // Step 1: Create schema
    console.log('Step 1: Creating schema...');
    const schemaResult = await createDatabaseSchema(testDatabaseId, testCreatorId);
    
    if (!schemaResult.success) {
      console.log(`❌ Schema creation failed: ${schemaResult.error}`);
      return;
    }
    
    console.log(`✅ Schema created: ${schemaResult.schemaName}`);
    
    // Step 2: Create Metabase table in schema
    console.log('\nStep 2: Creating Metabase table...');
    const tableResult = await createMetabaseTable(
      testTableId, 
      testTableName, 
      'test-org', 
      testDatabaseId
    );
    
    if (tableResult.success) {
      console.log(`✅ Metabase table created: ${tableResult.fullTableName}`);
      console.log(`   Schema: ${tableResult.schemaName}`);
      console.log(`   Table: ${tableResult.metabaseTableName}`);
      console.log(`   Records: ${tableResult.recordCount}`);
    } else {
      console.log(`❌ Metabase table creation failed: ${tableResult.error}`);
      return;
    }
    
    // Step 3: Test real-time sync
    console.log('\nStep 3: Testing real-time sync...');
    const testRecord = {
      id: 'test-record-123',
      table_id: testTableId,
      user_id: testCreatorId,
      site_id: 'test-site',
      data: {
        name: 'Test Record',
        value: 42,
        active: true
      },
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const syncResult = await updateMetabaseTable(
      testTableId, 
      testRecord, 
      'insert', 
      [], 
      testDatabaseId
    );
    
    if (syncResult.success) {
      console.log(`✅ Real-time sync successful: ${syncResult.fullTableName}`);
    } else {
      console.log(`❌ Real-time sync failed: ${syncResult.error}`);
    }
    
    // Step 4: Verify data
    console.log('\nStep 4: Verifying data...');
    const [rows] = await sequelize.query(`
      SELECT * FROM "${schemaResult.schemaName}"."${tableResult.metabaseTableName}"
    `);
    
    console.log(`✅ Found ${rows.length} records in table`);
    if (rows.length > 0) {
      console.log(`   Sample record:`, rows[0]);
    }
    
    // Step 5: Clean up
    console.log('\nStep 5: Cleaning up...');
    const deleteResult = await deleteDatabaseSchema(testDatabaseId, true);
    
    if (deleteResult.success) {
      console.log(`✅ Cleanup successful: ${deleteResult.schemaName}`);
    } else {
      console.log(`❌ Cleanup failed: ${deleteResult.error}`);
    }
    
  } catch (error) {
    console.error('❌ Metabase table creation test failed:', error);
  }
};

// Test end-to-end workflow
const testEndToEndWorkflow = async () => {
  console.log('🧪 Testing end-to-end workflow...\n');
  
  const testDatabaseId = '507f1f77bcf86cd799439444';
  const testCreatorId = '507f1f77bcf86cd799439333';
  
  try {
    // Step 1: Create database (simulate)
    console.log('Step 1: Creating database...');
    const schemaResult = await createDatabaseSchema(testDatabaseId, testCreatorId);
    
    if (!schemaResult.success) {
      console.log(`❌ Database creation failed: ${schemaResult.error}`);
      return;
    }
    
    console.log(`✅ Database created with schema: ${schemaResult.schemaName}`);
    
    // Step 2: Create multiple tables
    console.log('\nStep 2: Creating multiple tables...');
    const tables = [
      { id: 'table1', name: 'Users' },
      { id: 'table2', name: 'Products' },
      { id: 'table3', name: 'Orders' }
    ];
    
    const tableResults = [];
    for (const table of tables) {
      const result = await createMetabaseTable(
        table.id, 
        table.name, 
        'test-org', 
        testDatabaseId
      );
      
      if (result.success) {
        console.log(`   ✅ Created table: ${result.fullTableName}`);
        tableResults.push(result);
      } else {
        console.log(`   ❌ Failed to create table ${table.name}: ${result.error}`);
      }
    }
    
    // Step 3: Add records to tables
    console.log('\nStep 3: Adding records to tables...');
    for (const tableResult of tableResults) {
      const testRecord = {
        id: `record-${tableResult.metabaseTableName}-1`,
        table_id: tableResult.metabaseTableName.split('_')[2], // Extract table ID
        user_id: testCreatorId,
        site_id: 'test-site',
        data: {
          name: `Test ${tableResult.metabaseTableName}`,
          created_by: 'test-user'
        },
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const syncResult = await updateMetabaseTable(
        testRecord.table_id,
        testRecord,
        'insert',
        [],
        testDatabaseId
      );
      
      if (syncResult.success) {
        console.log(`   ✅ Added record to: ${syncResult.fullTableName}`);
      } else {
        console.log(`   ❌ Failed to add record: ${syncResult.error}`);
      }
    }
    
    // Step 4: Verify all data
    console.log('\nStep 4: Verifying all data...');
    const schemas = await listDatabaseSchemas();
    const testSchema = schemas.find(s => s.schema_name === schemaResult.schemaName);
    
    if (testSchema) {
      console.log(`✅ Schema ${testSchema.schema_name} has ${testSchema.tableCount} tables`);
      
      // List all tables in the schema
      const [tables] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${testSchema.schema_name}'
        ORDER BY table_name
      `);
      
      console.log('   Tables in schema:');
      for (const table of tables) {
        const [rowCount] = await sequelize.query(`
          SELECT COUNT(*) as count 
          FROM "${testSchema.schema_name}"."${table.table_name}"
        `);
        console.log(`     - ${table.table_name}: ${rowCount[0].count} records`);
      }
    }
    
    // Step 5: Clean up
    console.log('\nStep 5: Cleaning up...');
    const deleteResult = await deleteDatabaseSchema(testDatabaseId, true);
    
    if (deleteResult.success) {
      console.log(`✅ Cleanup successful: ${deleteResult.schemaName}`);
    } else {
      console.log(`❌ Cleanup failed: ${deleteResult.error}`);
    }
    
  } catch (error) {
    console.error('❌ End-to-end workflow test failed:', error);
  }
};

// Performance test
const testPerformance = async () => {
  console.log('🧪 Testing performance...\n');
  
  const testDatabaseId = '507f1f77bcf86cd799439222';
  const testCreatorId = '507f1f77bcf86cd799439111';
  
  try {
    // Create schema
    const schemaResult = await createDatabaseSchema(testDatabaseId, testCreatorId);
    if (!schemaResult.success) {
      console.log(`❌ Schema creation failed: ${schemaResult.error}`);
      return;
    }
    
    // Create table
    const tableResult = await createMetabaseTable(
      'perf-test-table',
      'Performance Test',
      'test-org',
      testDatabaseId
    );
    
    if (!tableResult.success) {
      console.log(`❌ Table creation failed: ${tableResult.error}`);
      return;
    }
    
    // Test bulk insert performance
    console.log('Testing bulk insert performance...');
    const startTime = Date.now();
    const recordCount = 100;
    
    for (let i = 0; i < recordCount; i++) {
      const testRecord = {
        id: `perf-record-${i}`,
        table_id: 'perf-test-table',
        user_id: testCreatorId,
        site_id: 'test-site',
        data: {
          index: i,
          name: `Record ${i}`,
          value: Math.random() * 1000
        },
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await updateMetabaseTable(
        'perf-test-table',
        testRecord,
        'insert',
        [],
        testDatabaseId
      );
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const recordsPerSecond = (recordCount / duration) * 1000;
    
    console.log(`✅ Inserted ${recordCount} records in ${duration}ms`);
    console.log(`   Performance: ${recordsPerSecond.toFixed(2)} records/second`);
    
    // Clean up
    await deleteDatabaseSchema(testDatabaseId, true);
    console.log('✅ Performance test completed');
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
  }
};

// Main test runner
const runTests = async () => {
  try {
    await connectDatabases();
    
    const testType = process.argv[2] || 'all';
    
    switch (testType) {
      case 'schema-name':
        testSchemaNameGeneration();
        break;
      case 'schema-management':
        await testSchemaManagement();
        break;
      case 'metabase-creation':
        await testMetabaseTableCreation();
        break;
      case 'end-to-end':
        await testEndToEndWorkflow();
        break;
      case 'performance':
        await testPerformance();
        break;
      case 'all':
        console.log('🚀 Running all tests...\n');
        testSchemaNameGeneration();
        await testSchemaManagement();
        await testMetabaseTableCreation();
        await testEndToEndWorkflow();
        await testPerformance();
        break;
      default:
        console.log('Usage: node test-schema-based-system.js [test-type]');
        console.log('Test types:');
        console.log('  schema-name      - Test schema name generation');
        console.log('  schema-management - Test schema CRUD operations');
        console.log('  metabase-creation - Test Metabase table creation');
        console.log('  end-to-end       - Test complete workflow');
        console.log('  performance      - Test performance');
        console.log('  all              - Run all tests (default)');
        break;
    }
    
    console.log('\n🎉 All tests completed!');
    
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
  runTests();
}

export { 
  testSchemaNameGeneration, 
  testSchemaManagement, 
  testMetabaseTableCreation, 
  testEndToEndWorkflow, 
  testPerformance 
};
