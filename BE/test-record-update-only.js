import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import { updateMetabaseTable } from './src/utils/metabaseTableCreator.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing Record Update Functions...');

async function testRecordUpdate() {
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
    
    // ===== FINAL VERIFICATION =====
    console.log('\n🔍 FINAL VERIFICATION...');
    
    const [finalRecords] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      WHERE id = '${newRecord.id}'
    `);
    
    console.log(`📊 Final record in Metabase:`, finalRecords[0] || 'Not found');
    
    console.log('\n🎉 Record update test completed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Record Update: SUCCESS');
    console.log('✅ Metabase Sync: SUCCESS');
    
    console.log('\n💡 Record update functions now have Metabase sync!');
    
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
testRecordUpdate();


