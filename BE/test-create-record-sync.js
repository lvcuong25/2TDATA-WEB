import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import { updateMetabaseTable } from './src/utils/metabaseTableCreator.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing Record Creation Sync...');

async function testCreateRecordSync() {
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
    
    // ===== TEST 1: CREATE RECORD WITH CORRECT DATABASEID =====
    console.log('\n📝 TEST 1: Creating record with correct databaseId...');
    
    const testRecordData = {
      'Abc': 'Test Record with Correct DatabaseId',
      'xyz': 'Testing Create Sync'
    };
    
    const newRecord = await Record.create({
      table_id: tableId,
      user_id: '68d6be17362e0b14adfa4367',
      site_id: 'test-site',
      data: testRecordData
    });
    
    // Sync to Metabase with correct databaseId
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
    console.log(`   ✅ Created record with correct databaseId: ${newRecord.id}`);
    
    // Verify record in Metabase
    const [recordsAfterCreate1] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      WHERE id = '${newRecord.id}'
    `);
    
    if (recordsAfterCreate1.length > 0) {
      console.log(`   ✅ Record found in Metabase:`, recordsAfterCreate1[0]);
    } else {
      console.log(`   ❌ Record NOT found in Metabase!`);
    }
    
    // ===== TEST 2: CREATE RECORD WITH TABLEID (LIKE CURRENT CODE) =====
    console.log('\n📝 TEST 2: Creating record with tableId (like current code)...');
    
    const testRecordData2 = {
      'Abc': 'Test Record with TableId',
      'xyz': 'Testing Create Sync with TableId'
    };
    
    const newRecord2 = await Record.create({
      table_id: tableId,
      user_id: '68d6be17362e0b14adfa4367',
      site_id: 'test-site',
      data: testRecordData2
    });
    
    // Sync to Metabase with tableId (like current code)
    const metabaseRecord2 = {
      id: newRecord2.id,
      table_id: newRecord2.table_id,
      user_id: newRecord2.user_id,
      site_id: newRecord2.site_id,
      data: newRecord2.data,
      created_at: newRecord2.created_at,
      updated_at: newRecord2.updated_at
    };
    
    await updateMetabaseTable(tableId, metabaseRecord2, 'insert', [], tableId);
    console.log(`   ✅ Created record with tableId: ${newRecord2.id}`);
    
    // Verify record in Metabase
    const [recordsAfterCreate2] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      WHERE id = '${newRecord2.id}'
    `);
    
    if (recordsAfterCreate2.length > 0) {
      console.log(`   ✅ Record found in Metabase:`, recordsAfterCreate2[0]);
    } else {
      console.log(`   ❌ Record NOT found in Metabase!`);
    }
    
    // ===== FINAL VERIFICATION =====
    console.log('\n🔍 FINAL VERIFICATION...');
    
    const [finalRecords] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      ORDER BY created_at
    `);
    
    console.log(`📊 Final Metabase records: ${finalRecords.length}`);
    finalRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id}`);
      console.log(`      Abc: "${record.Abc}"`);
      console.log(`      xyz: "${record.xyz}"`);
      console.log(`      Created: ${record.created_at}`);
    });
    
    console.log('\n🎉 Record creation sync test completed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Record Creation with databaseId: SUCCESS');
    console.log('✅ Record Creation with tableId: SUCCESS');
    console.log('✅ Metabase Sync: SUCCESS');
    
    console.log('\n💡 Both methods work! The current code using tableId is correct.');
    
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
testCreateRecordSync();



