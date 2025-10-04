import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing All Column Operations...');

async function testAllColumnOperations() {
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
    let columns = await Column.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });
    
    console.log(`\n📋 Initial columns (${columns.length}):`);
    columns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name} (${col.data_type})`);
    });
    
    // Get current records
    let records = await Record.findAll({
      where: { table_id: tableId },
      order: [['created_at', 'ASC']]
    });
    
    console.log(`\n📊 Initial records (${records.length}):`);
    records.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id}`);
      console.log(`      Data:`, record.data);
    });
    
    // ===== TEST 1: ADD NEW COLUMN =====
    console.log('\n📝 TEST 1: Adding new column...');
    
    const newColumnName = 'Another New Test Column';
    const newColumn = await Column.create({
      name: newColumnName,
      key: newColumnName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_'),
      type: 'string',
      data_type: 'text',
      is_required: false,
      is_unique: false,
      default_value: null,
      order: columns.length,
      table_id: tableId,
      user_id: '68d6be17362e0b14adfa4367',
      site_id: 'test-site'
    });
    
    console.log(`   ✅ New column created: ${newColumn.name} (${newColumn.data_type})`);
    
    // Update Metabase table structure
    try {
      const { createMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
      await createMetabaseTable(tableId, table.name, null, databaseId);
      console.log(`   ✅ Metabase table structure updated with new column`);
    } catch (metabaseError) {
      console.log(`   ❌ Metabase update failed: ${metabaseError.message}`);
    }
    
    // ===== TEST 2: RENAME COLUMN =====
    console.log('\n📝 TEST 2: Renaming column...');
    
    const columnToRename = columns.find(col => col.name === 'Abc');
    if (columnToRename) {
      const oldName = columnToRename.name;
      const newName = 'Renamed Abc Column';
      
      console.log(`   📝 Renaming column from "${oldName}" to "${newName}"`);
      
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
      
      // Update column name
      await columnToRename.update({ name: newName });
      console.log(`   ✅ Column name updated in database`);
      
      // Update Metabase table structure
      try {
        const { createMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
        await createMetabaseTable(tableId, table.name, null, databaseId);
        console.log(`   ✅ Metabase table structure updated`);
      } catch (metabaseError) {
        console.log(`   ❌ Metabase update failed: ${metabaseError.message}`);
      }
    } else {
      console.log(`   ⚠️ Column "Abc" not found, skipping rename test`);
    }
    
    // ===== TEST 3: DELETE COLUMN =====
    console.log('\n📝 TEST 3: Deleting column...');
    
    const columnToDelete = columns.find(col => col.name === 'Test Column');
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
      console.log(`   ✅ Column deleted from database`);
      
      // Update Metabase table structure
      try {
        const { createMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
        await createMetabaseTable(tableId, table.name, null, databaseId);
        console.log(`   ✅ Metabase table structure updated`);
      } catch (metabaseError) {
        console.log(`   ❌ Metabase update failed: ${metabaseError.message}`);
      }
    } else {
      console.log(`   ⚠️ Column "Test Column" not found, skipping delete test`);
    }
    
    // ===== FINAL VERIFICATION =====
    console.log('\n🔍 FINAL VERIFICATION...');
    
    // Check updated columns
    const finalColumns = await Column.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });
    
    console.log(`\n📋 Final columns (${finalColumns.length}):`);
    finalColumns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name} (${col.data_type})`);
    });
    
    // Check updated records
    const finalRecords = await Record.findAll({
      where: { table_id: tableId },
      order: [['created_at', 'ASC']]
    });
    
    console.log(`\n📊 Final records (${finalRecords.length}):`);
    finalRecords.forEach((record, index) => {
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
      
      console.log(`📋 Metabase columns (${metabaseColumns.length}):`);
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
        // Show all columns dynamically
        Object.keys(record).forEach(key => {
          if (!['id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at'].includes(key)) {
            console.log(`      ${key}: "${record[key] || '[null]'}"`);
          }
        });
      });
    }
    
    console.log('\n🎉 All column operations test completed!');
    
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
testAllColumnOperations();
