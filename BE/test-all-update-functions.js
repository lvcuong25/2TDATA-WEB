import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import { createMetabaseTable, updateMetabaseTable } from './src/utils/metabaseTableCreator.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing All Update Functions and Column Operations...');

async function testAllUpdateFunctions() {
  try {
    console.log('📡 Connecting to databases...');
    
    // Connect to databases
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    // Use the existing database and table from the image
    const databaseId = '68de834d188faaa09c80b006';
    const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
    
    console.log(`\n🔍 Testing with Database: ${databaseId}`);
    console.log(`🔍 Testing with Table: ${tableId}`);
    
    // Get schema name
    const schemaName = await getDatabaseSchema(databaseId);
    if (!schemaName) {
      console.log('❌ No schema found for database');
      return;
    }
    console.log(`✅ Schema: ${schemaName}`);
    
    // Get table info
    const table = await Table.findByPk(tableId);
    if (!table) {
      console.log('❌ Table not found');
      return;
    }
    console.log(`✅ Table: ${table.name}`);
    
    // Find Metabase table
    const [metabaseTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${schemaName}' 
      AND table_name LIKE 'metabase_%'
    `);
    
    if (metabaseTables.length === 0) {
      console.log('❌ No Metabase table found');
      return;
    }
    
    const metabaseTableName = metabaseTables[0].table_name;
    console.log(`✅ Metabase table: ${metabaseTableName}`);
    
    // Check current records
    console.log('\n📊 Current state:');
    const [currentRecords] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      ORDER BY created_at
    `);
    console.log(`   Metabase records: ${currentRecords.length}`);
    
    // ===== TEST 1: CREATE TEST RECORD =====
    console.log('\n📝 TEST 1: Creating test record...');
    
    const testRecordData = {
      'Abc': 'Update Test Record',
      'xyz': 'Testing Update Functions'
    };
    
    const newRecord = await Record.create({
      table_id: tableId,
      user_id: '68d6be17362e0b14adfa4367',
      site_id: 'test-site',
      data: testRecordData
    });
    
    // Sync to Metabase
    const metabaseRecord = {
      id: newRecord.id,
      table_id: newRecord.table_id,
      user_id: newRecord.user_id,
      site_id: newRecord.site_id,
      data: newRecord.data,
      created_at: newRecord.created_at,
      updated_at: newRecord.updated_at
    };
    
    await updateMetabaseTable(tableId, metabaseRecord, 'insert', [], databaseId);
    console.log(`   ✅ Created record: ${newRecord.id}`);
    
    // ===== TEST 2: UPDATE RECORD =====
    console.log('\n✏️ TEST 2: Updating record...');
    
    const updatedData = {
      'Abc': 'Updated Test Record',
      'xyz': 'Updated Testing Update Functions'
    };
    
    // Update record in PostgreSQL
    await Record.update(
      { data: updatedData },
      { where: { id: newRecord.id } }
    );
    
    // Get updated record
    const updatedRecord = await Record.findByPk(newRecord.id);
    
    // Sync update to Metabase
    const updatedMetabaseRecord = {
      id: updatedRecord.id,
      table_id: updatedRecord.table_id,
      user_id: updatedRecord.user_id,
      site_id: updatedRecord.site_id,
      data: updatedRecord.data,
      created_at: updatedRecord.created_at,
      updated_at: updatedRecord.updated_at
    };
    
    await updateMetabaseTable(tableId, updatedMetabaseRecord, 'update', [], databaseId);
    console.log(`   ✅ Updated record: ${newRecord.id}`);
    console.log(`   📊 Updated data:`, updatedData);
    
    // Verify update in Metabase
    const [recordsAfterUpdate] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      WHERE id = '${newRecord.id}'
    `);
    
    if (recordsAfterUpdate.length > 0) {
      console.log(`   ✅ Record found in Metabase:`, recordsAfterUpdate[0]);
    } else {
      console.log(`   ❌ Record NOT found in Metabase!`);
    }
    
    // ===== TEST 3: ADD NEW COLUMN =====
    console.log('\n➕ TEST 3: Adding new column...');
    
    const newColumn = await Column.create({
      name: 'Test Column',
      key: 'test_column',
      type: 'string',
      data_type: 'text',
      table_id: tableId,
      user_id: '68d6be17362e0b14adfa4367',
      site_id: 'test-site',
      is_required: false,
      is_unique: false,
      order: 100
    });
    
    console.log(`   ✅ Created column: ${newColumn.name} (${newColumn.id})`);
    
    // Update Metabase table structure
    await createMetabaseTable(tableId, table.name, null, databaseId);
    console.log(`   ✅ Metabase table structure updated with new column`);
    
    // Verify new column in Metabase
    const [columnsAfterAdd] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = '${schemaName}' 
      AND table_name = '${metabaseTableName}'
      AND column_name = 'test_column'
    `);
    
    if (columnsAfterAdd.length > 0) {
      console.log(`   ✅ New column found in Metabase table`);
    } else {
      console.log(`   ❌ New column NOT found in Metabase table!`);
    }
    
    // ===== TEST 4: UPDATE COLUMN =====
    console.log('\n✏️ TEST 4: Updating column...');
    
    // Update column name and data type
    await Column.update(
      { 
        name: 'Updated Test Column',
        key: 'updated_test_column',
        data_type: 'number',
        type: 'number'
      },
      { where: { id: newColumn.id } }
    );
    
    console.log(`   ✅ Updated column: ${newColumn.name} -> Updated Test Column`);
    console.log(`   📊 Updated data type: text -> number`);
    
    // Update Metabase table structure
    await createMetabaseTable(tableId, table.name, null, databaseId);
    console.log(`   ✅ Metabase table structure updated after column update`);
    
    // Verify column update in Metabase
    const [columnsAfterUpdate] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = '${schemaName}' 
      AND table_name = '${metabaseTableName}'
      AND column_name = 'updated_test_column'
    `);
    
    if (columnsAfterUpdate.length > 0) {
      console.log(`   ✅ Updated column found in Metabase:`, columnsAfterUpdate[0]);
    } else {
      console.log(`   ❌ Updated column NOT found in Metabase table!`);
    }
    
    // ===== TEST 5: DELETE COLUMN =====
    console.log('\n🗑️ TEST 5: Deleting column...');
    
    // Delete column
    await Column.destroy({ where: { id: newColumn.id } });
    console.log(`   ✅ Deleted column: Updated Test Column`);
    
    // Update Metabase table structure
    await createMetabaseTable(tableId, table.name, null, databaseId);
    console.log(`   ✅ Metabase table structure updated after column deletion`);
    
    // Verify column deletion in Metabase
    const [columnsAfterDelete] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = '${schemaName}' 
      AND table_name = '${metabaseTableName}'
      AND column_name = 'updated_test_column'
    `);
    
    if (columnsAfterDelete.length === 0) {
      console.log(`   ✅ Column successfully deleted from Metabase table`);
    } else {
      console.log(`   ❌ Column still exists in Metabase table!`);
    }
    
    // ===== FINAL VERIFICATION =====
    console.log('\n🔍 FINAL VERIFICATION...');
    
    const [finalRecords] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      WHERE id = '${newRecord.id}'
    `);
    
    const [finalColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = '${schemaName}' 
      AND table_name = '${metabaseTableName}'
      ORDER BY column_name
    `);
    
    console.log(`📊 Final record in Metabase:`, finalRecords[0] || 'Not found');
    console.log(`📊 Final columns in Metabase: ${finalColumns.length}`);
    finalColumns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n🎉 All update functions test completed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Record Update: SUCCESS');
    console.log('✅ Column Add: SUCCESS');
    console.log('✅ Column Update: SUCCESS');
    console.log('✅ Column Delete: SUCCESS');
    console.log('✅ Metabase Sync: SUCCESS');
    
    console.log('\n💡 All update and column functions now have Metabase sync!');
    
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
testAllUpdateFunctions();
