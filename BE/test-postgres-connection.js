import { sequelize, Table, Column, Record, Row, syncModels } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

dotenv.config();

const testPostgreSQLConnection = async () => {
  try {
    console.log('🚀 Testing PostgreSQL connection and models...\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully');
    
    // Sync models (create tables if they don't exist)
    console.log('📋 Syncing models...');
    await syncModels(false); // Don't force, just create if not exists
    console.log('✅ Models synchronized successfully');
    
    // Test creating a sample table
    console.log('🧪 Testing table creation...');
    const testTable = await Table.create({
      name: 'Test Table',
      database_id: 'test-database-id',
      user_id: 'test-user-id',
      site_id: 'test-site-id',
      description: 'This is a test table',
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
    
    // Test creating a sample column
    console.log('🧪 Testing column creation...');
    const testColumn = await Column.create({
      name: 'Test Column',
      key: 'test_column',
      type: 'string',
      table_id: testTable.id,
      user_id: 'test-user-id',
      site_id: 'test-site-id',
      data_type: 'string',
      is_required: false,
      is_unique: false,
      order: 0
    });
    
    console.log('✅ Test column created:', {
      id: testColumn.id,
      name: testColumn.name,
      table_id: testColumn.table_id
    });
    
    // Test creating a sample record
    console.log('🧪 Testing record creation...');
    const testRecord = await Record.create({
      table_id: testTable.id,
      user_id: 'test-user-id',
      site_id: 'test-site-id',
      data: {
        test_column: 'Test value',
        another_field: 'Another value'
      }
    });
    
    console.log('✅ Test record created:', {
      id: testRecord.id,
      table_id: testRecord.table_id,
      data: testRecord.data
    });
    
    // Test creating a sample row
    console.log('🧪 Testing row creation...');
    const testRow = await Row.create({
      table_id: testTable.id,
      data: {
        test_column: 'Row test value'
      },
      created_by: 'test-user-id'
    });
    
    console.log('✅ Test row created:', {
      id: testRow.id,
      table_id: testRow.table_id,
      data: testRow.data
    });
    
    // Test reading data
    console.log('🧪 Testing data retrieval...');
    const tables = await Table.findAll();
    const columns = await Column.findAll();
    const records = await Record.findAll();
    const rows = await Row.findAll();
    
    console.log('✅ Data retrieval successful:');
    console.log(`   - Tables: ${tables.length}`);
    console.log(`   - Columns: ${columns.length}`);
    console.log(`   - Records: ${records.length}`);
    console.log(`   - Rows: ${rows.length}`);
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await Row.destroy({ where: { table_id: testTable.id } });
    await Record.destroy({ where: { table_id: testTable.id } });
    await Column.destroy({ where: { table_id: testTable.id } });
    await Table.destroy({ where: { id: testTable.id } });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All PostgreSQL tests passed successfully!');
    console.log('✅ Ready for hybrid MongoDB + PostgreSQL implementation');
    
  } catch (error) {
    console.error('❌ PostgreSQL test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPostgreSQLConnection();
}

export { testPostgreSQLConnection };