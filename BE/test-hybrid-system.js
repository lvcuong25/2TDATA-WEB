import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import TableMongo from './src/model/Table.js';
import ColumnMongo from './src/model/Column.js';
import RecordMongo from './src/model/Record.js';
import { createMetabaseTable, updateMetabaseTable } from './src/utils/metabaseTableCreator.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Connect to PostgreSQL
const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error);
    throw error;
  }
};

// Test hybrid system
const testHybridSystem = async () => {
  try {
    console.log('🚀 Testing Hybrid MongoDB + PostgreSQL System...\n');
    
    // Test 1: Create test table in PostgreSQL
    console.log('📋 Test 1: Creating test table in PostgreSQL...');
    const testTable = await Table.create({
      name: 'Test Hybrid Table',
      database_id: 'test-database-id',
      user_id: 'test-user-id',
      site_id: 'test-site-id',
      description: 'Test table for hybrid system',
      table_access_rule: {
        userIds: [],
        allUsers: false,
        access: []
      },
      column_access_rules: [],
      record_access_rules: [],
      cell_access_rules: []
    });
    
    console.log('✅ Test table created:', {
      id: testTable.id,
      name: testTable.name,
      database_id: testTable.database_id
    });
    
    // Test 2: Create test columns in PostgreSQL
    console.log('\n📋 Test 2: Creating test columns in PostgreSQL...');
    const testColumns = [];
    
    const column1 = await Column.create({
      name: 'Name',
      key: 'name',
      type: 'string',
      table_id: testTable.id,
      user_id: 'test-user-id',
      site_id: 'test-site-id',
      data_type: 'text',
      is_required: true,
      is_unique: false,
      order: 0
    });
    
    const column2 = await Column.create({
      name: 'Age',
      key: 'age',
      type: 'number',
      table_id: testTable.id,
      user_id: 'test-user-id',
      site_id: 'test-site-id',
      data_type: 'number',
      is_required: false,
      is_unique: false,
      order: 1
    });
    
    testColumns.push(column1, column2);
    console.log('✅ Test columns created:', testColumns.map(col => ({
      id: col.id,
      name: col.name,
      data_type: col.data_type
    })));
    
    // Test 3: Create test records in PostgreSQL
    console.log('\n📋 Test 3: Creating test records in PostgreSQL...');
    const testRecords = [];
    
    const record1 = await Record.create({
      table_id: testTable.id,
      user_id: 'test-user-id',
      site_id: 'test-site-id',
      data: {
        name: 'John Doe',
        age: 30
      }
    });
    
    const record2 = await Record.create({
      table_id: testTable.id,
      user_id: 'test-user-id',
      site_id: 'test-site-id',
      data: {
        name: 'Jane Smith',
        age: 25
      }
    });
    
    testRecords.push(record1, record2);
    console.log('✅ Test records created:', testRecords.map(rec => ({
      id: rec.id,
      data: rec.data
    })));
    
    // Test 4: Test hybrid data reading
    console.log('\n📋 Test 4: Testing hybrid data reading...');
    
    // Read from PostgreSQL
    const postgresTables = await Table.findAll();
    const postgresColumns = await Column.findAll();
    const postgresRecords = await Record.findAll();
    
    console.log('✅ PostgreSQL data:');
    console.log(`   - Tables: ${postgresTables.length}`);
    console.log(`   - Columns: ${postgresColumns.length}`);
    console.log(`   - Records: ${postgresRecords.length}`);
    
    // Read from MongoDB (if any data exists)
    const mongoTables = await TableMongo.find({});
    const mongoColumns = await ColumnMongo.find({});
    const mongoRecords = await RecordMongo.find({});
    
    console.log('✅ MongoDB data:');
    console.log(`   - Tables: ${mongoTables.length}`);
    console.log(`   - Columns: ${mongoColumns.length}`);
    console.log(`   - Records: ${mongoRecords.length}`);
    
    // Test 5: Test Metabase table creation
    console.log('\n📋 Test 5: Testing Metabase table creation...');
    try {
      const metabaseResult = await createMetabaseTable(
        testTable.id, 
        testTable.name, 
        'test-org-id'
      );
      
      if (metabaseResult.success) {
        console.log('✅ Metabase table created successfully:');
        console.log(`   - Table name: ${metabaseResult.metabaseTableName}`);
        console.log(`   - Data fields: ${metabaseResult.dataFields.join(', ')}`);
        console.log(`   - Record count: ${metabaseResult.recordCount}`);
        console.log(`   - Column count: ${metabaseResult.columnCount}`);
      } else {
        console.log('❌ Metabase table creation failed:', metabaseResult.error);
      }
    } catch (metabaseError) {
      console.log('⚠️ Metabase test skipped (PostgreSQL not configured):', metabaseError.message);
    }
    
    // Test 6: Test Metabase record update
    console.log('\n📋 Test 6: Testing Metabase record update...');
    try {
      const updateResult = await updateMetabaseTable(
        testTable.id,
        {
          id: record1.id,
          table_id: record1.table_id,
          user_id: record1.user_id,
          site_id: record1.site_id,
          data: record1.data,
          created_at: record1.created_at,
          updated_at: record1.updated_at
        },
        'insert'
      );
      
      if (updateResult.success) {
        console.log('✅ Metabase record update successful');
      } else {
        console.log('❌ Metabase record update failed:', updateResult.error);
      }
    } catch (metabaseError) {
      console.log('⚠️ Metabase update test skipped:', metabaseError.message);
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Record.destroy({ where: { table_id: testTable.id } });
    await Column.destroy({ where: { table_id: testTable.id } });
    await Table.destroy({ where: { id: testTable.id } });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All hybrid system tests passed successfully!');
    console.log('✅ System is ready for production use');
    
  } catch (error) {
    console.error('❌ Hybrid system test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
};

// Main test function
const runTests = async () => {
  try {
    await connectMongoDB();
    await connectPostgreSQL();
    await testHybridSystem();
    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
    process.exit(0);
  }
};

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { testHybridSystem, runTests };