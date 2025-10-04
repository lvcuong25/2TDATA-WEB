import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import { updateMetabaseTable } from './src/utils/metabaseTableCreator.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Fixing Invalid Records...');

async function fixInvalidRecords() {
  try {
    console.log('📡 Connecting to databases...');
    
    // Connect to databases
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    const databaseId = '68de834d188faaa09c80b006';
    const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
    
    console.log(`\n🔍 Fixing Database: ${databaseId}`);
    console.log(`🔍 Fixing Table: ${tableId}`);
    
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
    
    console.log(`\n📋 Valid columns in table:`);
    const validColumnNames = columns.map(col => col.name);
    columns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name} (${col.data_type})`);
    });
    
    // ===== FIND INVALID RECORDS =====
    console.log('\n🔍 FINDING INVALID RECORDS...');
    
    const allRecords = await Record.findAll({
      where: { table_id: tableId },
      order: [['created_at', 'ASC']]
    });
    
    console.log(`📊 Found ${allRecords.length} total records`);
    
    const invalidRecords = [];
    const validRecords = [];
    
    for (const record of allRecords) {
      const recordData = record.data || {};
      const recordColumnNames = Object.keys(recordData);
      
      // Check if record has any invalid columns
      const hasInvalidColumns = recordColumnNames.some(colName => !validColumnNames.includes(colName));
      
      if (hasInvalidColumns) {
        invalidRecords.push(record);
        console.log(`   ❌ Invalid record: ${record.id}`);
        console.log(`      Invalid columns: ${recordColumnNames.filter(col => !validColumnNames.includes(col)).join(', ')}`);
        console.log(`      Data:`, recordData);
      } else {
        validRecords.push(record);
      }
    }
    
    console.log(`\n📊 Analysis Results:`);
    console.log(`   Valid records: ${validRecords.length}`);
    console.log(`   Invalid records: ${invalidRecords.length}`);
    
    // ===== FIX INVALID RECORDS =====
    if (invalidRecords.length > 0) {
      console.log(`\n🔧 FIXING INVALID RECORDS...`);
      
      for (const record of invalidRecords) {
        console.log(`\n📝 Fixing record: ${record.id}`);
        
        // Create clean data with only valid columns
        const cleanData = {};
        const recordData = record.data || {};
        
        for (const column of columns) {
          if (recordData[column.name] !== undefined) {
            cleanData[column.name] = recordData[column.name];
          }
        }
        
        console.log(`   📊 Original data:`, recordData);
        console.log(`   📊 Clean data:`, cleanData);
        
        // Update record with clean data
        await record.update({ data: cleanData });
        console.log(`   ✅ Record updated with clean data`);
        
        // Re-sync to Metabase
        const metabaseRecord = {
          id: record.id,
          table_id: record.table_id,
          user_id: record.user_id,
          site_id: record.site_id,
          data: cleanData,
          created_at: record.created_at,
          updated_at: record.updated_at
        };
        
        try {
          await updateMetabaseTable(tableId, metabaseRecord, 'insert', [], databaseId);
          console.log(`   ✅ Re-synced to Metabase`);
        } catch (syncError) {
          console.log(`   ❌ Re-sync failed: ${syncError.message}`);
        }
      }
    }
    
    // ===== FINAL VERIFICATION =====
    console.log('\n🔍 FINAL VERIFICATION...');
    
    const [finalMetabaseRecords] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."metabase_test_table_schema_8739b0d9"
      ORDER BY created_at
    `);
    
    console.log(`📊 Final Metabase records: ${finalMetabaseRecords.length}`);
    finalMetabaseRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id}`);
      console.log(`      Abc: "${record.Abc || '[null]'}"`);
      console.log(`      Test_Column: "${record.Test_Column || '[null]'}"`);
      console.log(`      Test_Column_3: "${record.Test_Column_3 || '[null]'}"`);
      console.log(`      Created: ${record.created_at}`);
    });
    
    console.log('\n🎉 Invalid records fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
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

// Run the fix
fixInvalidRecords();


