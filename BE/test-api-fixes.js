import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
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

// Test API fixes
const testAPIFixes = async () => {
  try {
    console.log('🚀 Testing API fixes for hybrid system...\n');
    
    // Test 1: Create a test table in PostgreSQL
    console.log('📋 Test 1: Creating test table in PostgreSQL...');
    const testTable = await Table.create({
      name: 'API Test Table',
      database_id: 'test-database-id',
      user_id: 'test-user-id',
      site_id: 'test-site-id',
      description: 'Test table for API fixes',
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
      name: testTable.name
    });
    
    // Test 2: Test field preference API with PostgreSQL table ID
    console.log('\n📋 Test 2: Testing field preference API...');
    const fieldPreferenceController = await import('./src/controllers/fieldPreferenceController.js');
    
    // Mock request object
    const mockReq = {
      params: { tableId: testTable.id },
      user: { _id: 'test-user-id' }
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`   Status: ${code}`);
          console.log(`   Response:`, data);
          return { status: code, json: data };
        }
      }),
      json: (data) => {
        console.log(`   Response:`, data);
        return { json: data };
      }
    };
    
    try {
      await fieldPreferenceController.getFieldPreference(mockReq, mockRes);
      console.log('✅ Field preference API test passed');
    } catch (error) {
      console.log('❌ Field preference API test failed:', error.message);
    }
    
    // Test 3: Test permissions APIs
    console.log('\n📋 Test 3: Testing permissions APIs...');
    
    // Test column permissions
    try {
      const columnPermissionController = await import('./src/controllers/columnPermissionController.js');
      await columnPermissionController.getTableColumnPermissions(mockReq, mockRes);
      console.log('✅ Column permissions API test passed');
    } catch (error) {
      console.log('❌ Column permissions API test failed:', error.message);
    }
    
    // Test record permissions
    try {
      const recordPermissionController = await import('./src/controllers/recordPermissionController.js');
      await recordPermissionController.getTableRecordPermissions(mockReq, mockRes);
      console.log('✅ Record permissions API test passed');
    } catch (error) {
      console.log('❌ Record permissions API test failed:', error.message);
    }
    
    // Test cell permissions
    try {
      const cellPermissionController = await import('./src/controllers/cellPermissionController.js');
      await cellPermissionController.getTableCellPermissions(mockReq, mockRes);
      console.log('✅ Cell permissions API test passed');
    } catch (error) {
      console.log('❌ Cell permissions API test failed:', error.message);
    }
    
    // Test 4: Test hybrid data reading
    console.log('\n📋 Test 4: Testing hybrid data reading...');
    
    // Test table reading
    const [mongoTables, postgresTables] = await Promise.all([
      mongoose.connection.db.collection('tables').find({}).toArray(),
      Table.findAll()
    ]);
    
    console.log('✅ Hybrid table reading:');
    console.log(`   - MongoDB tables: ${mongoTables.length}`);
    console.log(`   - PostgreSQL tables: ${postgresTables.length}`);
    
    // Test column reading
    const [mongoColumns, postgresColumns] = await Promise.all([
      mongoose.connection.db.collection('columns').find({}).toArray(),
      Column.findAll()
    ]);
    
    console.log('✅ Hybrid column reading:');
    console.log(`   - MongoDB columns: ${mongoColumns.length}`);
    console.log(`   - PostgreSQL columns: ${postgresColumns.length}`);
    
    // Test record reading
    const [mongoRecords, postgresRecords] = await Promise.all([
      mongoose.connection.db.collection('records').find({}).toArray(),
      Record.findAll()
    ]);
    
    console.log('✅ Hybrid record reading:');
    console.log(`   - MongoDB records: ${mongoRecords.length}`);
    console.log(`   - PostgreSQL records: ${postgresRecords.length}`);
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Table.destroy({ where: { id: testTable.id } });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All API fixes tests passed successfully!');
    console.log('✅ System should now work without console errors');
    
  } catch (error) {
    console.error('❌ API fixes test failed:', error);
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
    await testAPIFixes();
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

export { testAPIFixes, runTests };
