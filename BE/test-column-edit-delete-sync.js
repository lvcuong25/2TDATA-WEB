import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import { updateMetabaseTable } from './src/utils/metabaseTableCreator.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing Column Edit/Delete Sync...');

async function testColumnEditDeleteSync() {
  try {
    console.log('📡 Connecting to databases...');
    
    // Connect to databases
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
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
    
    // Get current columns
    const columns = await Column.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });
    
    console.log(`\n📋 Current columns:`);
    columns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name} (${col.data_type})`);
    });
    
    // Get current records
    const records = await Record.findAll({
      where: { table_id: tableId },
      order: [['created_at', 'ASC']]
    });
    
    console.log(`\n📊 Current records (${records.length}):`);
    records.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id}`);
      console.log(`      Data:`, record.data);
    });
    
    // ===== TEST 1: RENAME COLUMN =====
    console.log('\n📝 TEST 1: Renaming column...');
    
    const columnToRename = columns.find(col => col.name === 'Test Column');
    if (columnToRename) {
      const oldName = columnToRename.name;
      const newName = 'Renamed Test Column';
      
      console.log(`   📝 Renaming column from "${oldName}" to "${newName}"`);
      
      // Update column name
      await columnToRename.update({ name: newName });
      
      // Update all records with the new column name
      let updatedCount = 0;
      for (const record of records) {
        if (record.data && record.data[oldName] !== undefined) {
          const oldValue = record.data[oldName];
          
          // Create new data object
          const newData = { ...record.data };
          delete newData[oldName];
          newData[newName] = oldValue;
          
          await record.update({ data: newData });
          updatedCount++;
        }
      }
      
      console.log(`   ✅ Successfully renamed column key in ${updatedCount} records`);
      
      // Update Metabase table structure
      try {
        const { createMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
        await createMetabaseTable(tableId, null, null, databaseId);
        console.log(`   ✅ Metabase table structure updated`);
      } catch (metabaseError) {
        console.log(`   ❌ Metabase update failed: ${metabaseError.message}`);
      }
    } else {
      console.log(`   ⚠️ Column "Test Column" not found, skipping rename test`);
    }
    
    // ===== TEST 2: DELETE COLUMN =====
    console.log('\n📝 TEST 2: Deleting column...');
    
    const columnToDelete = columns.find(col => col.name === 'Test Column 3');
    if (columnToDelete) {
      const columnName = columnToDelete.name;
      
      console.log(`   📝 Deleting column: "${columnName}"`);
      
      // Remove column data from all records
      let updatedCount = 0;
      for (const record of records) {
        if (record.data && record.data[columnName] !== undefined) {
          const newData = { ...record.data };
          delete newData[columnName];
          
          await record.update({ data: newData });
          updatedCount++;
        }
      }
      
      console.log(`   ✅ Successfully removed column data from ${updatedCount} records`);
      
      // Delete column
      await columnToDelete.destroy();
      console.log(`   ✅ Column deleted from PostgreSQL`);
      
      // Update Metabase table structure
      try {
        const { createMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
        await createMetabaseTable(tableId, null, null, databaseId);
        console.log(`   ✅ Metabase table structure updated`);
      } catch (metabaseError) {
        console.log(`   ❌ Metabase update failed: ${metabaseError.message}`);
      }
    } else {
      console.log(`   ⚠️ Column "Test Column 3" not found, skipping delete test`);
    }
    
    // ===== FINAL VERIFICATION =====
    console.log('\n🔍 FINAL VERIFICATION...');
    
    // Check updated columns
    const updatedColumns = await Column.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });
    
    console.log(`\n📋 Updated columns:`);
    updatedColumns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name} (${col.data_type})`);
    });
    
    // Check updated records
    const updatedRecords = await Record.findAll({
      where: { table_id: tableId },
      order: [['created_at', 'ASC']]
    });
    
    console.log(`\n📊 Updated records (${updatedRecords.length}):`);
    updatedRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id}`);
      console.log(`      Data:`, record.data);
    });
    
    // Check Metabase table
    const [metabaseTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${schemaName}' 
      AND table_name LIKE 'metabase_%'
    `);
    
    if (metabaseTables.length > 0) {
      const metabaseTableName = metabaseTables[0].table_name;
      console.log(`\n📊 Metabase table: ${metabaseTableName}`);
      
      const [metabaseColumns] = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = '${schemaName}' 
        AND table_name = '${metabaseTableName}'
        AND column_name NOT IN ('id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at')
        ORDER BY column_name
      `);
      
      console.log(`📋 Metabase columns:`);
      metabaseColumns.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.column_name} (${col.data_type})`);
      });
      
      const [metabaseRecords] = await sequelize.query(`
        SELECT * FROM "${schemaName}"."${metabaseTableName}"
        ORDER BY created_at
      `);
      
      console.log(`📊 Metabase records (${metabaseRecords.length}):`);
      metabaseRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}`);
        console.log(`      Abc: "${record.Abc || '[null]'}"`);
        if (record.Renamed_Test_Column) console.log(`      Renamed_Test_Column: "${record.Renamed_Test_Column}"`);
        if (record.Test_Column) console.log(`      Test_Column: "${record.Test_Column}"`);
        if (record.Test_Column_3) console.log(`      Test_Column_3: "${record.Test_Column_3}"`);
      });
    }
    
    console.log('\n🎉 Column edit/delete sync test completed!');
    
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
testColumnEditDeleteSync();



