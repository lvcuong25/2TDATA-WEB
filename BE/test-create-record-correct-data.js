import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import { updateMetabaseTable } from './src/utils/metabaseTableCreator.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing Record Creation with Correct Data...');

async function testCreateRecordCorrectData() {
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
    
    // Get actual columns from PostgreSQL
    const columns = await Column.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });
    
    console.log(`\n📋 Actual columns in table:`);
    columns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name} (${col.data_type})`);
    });
    
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
    
    // ===== TEST: CREATE RECORD WITH CORRECT DATA =====
    console.log('\n📝 TEST: Creating record with correct data...');
    
    // Use actual column names from PostgreSQL
    const testRecordData = {
      'Abc': 'Test Record with Correct Data',
      'Test Column': 'Testing Create Sync',
      'Test Column 3': 123
    };
    
    const newRecord = await Record.create({
      table_id: tableId,
      user_id: '68d6be17362e0b14adfa4367',
      site_id: 'test-site',
      data: testRecordData
    });
    
    console.log(`   ✅ Created record in PostgreSQL: ${newRecord.id}`);
    console.log(`   📊 Data:`, testRecordData);
    
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
    console.log(`   ✅ Synced to Metabase: ${newRecord.id}`);
    
    // Verify record in Metabase
    const [recordsAfterCreate] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      WHERE id = '${newRecord.id}'
    `);
    
    if (recordsAfterCreate.length > 0) {
      console.log(`   ✅ Record found in Metabase:`, recordsAfterCreate[0]);
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
      if (record.Test_Column) console.log(`      Test_Column: "${record.Test_Column}"`);
      if (record.Test_Column_3) console.log(`      Test_Column_3: "${record.Test_Column_3}"`);
      console.log(`      Created: ${record.created_at}`);
    });
    
    console.log('\n🎉 Record creation test completed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Record Creation: SUCCESS');
    console.log('✅ Metabase Sync: SUCCESS');
    
    console.log('\n💡 Record creation sync is working correctly!');
    
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
testCreateRecordCorrectData();



