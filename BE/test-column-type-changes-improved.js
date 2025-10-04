import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing Improved Column Type Changes...');

async function testImprovedColumnTypeChanges() {
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
      console.log(`   ${index + 1}. ${col.name} (${col.data_type}) - Type: ${col.type}`);
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
    
    // ===== TEST 1: CHANGE COLUMN TYPE FROM TEXT TO NUMBER =====
    console.log('\n📝 TEST 1: Changing column type from text to number...');
    
    const columnToChange = columns.find(col => col.name === 'New Test Column');
    if (columnToChange) {
      const oldDataType = columnToChange.data_type;
      const oldType = columnToChange.type;
      const newDataType = 'number';
      const newType = 'number';
      
      console.log(`   📝 Changing column "${columnToChange.name}" from ${oldDataType} (${oldType}) to ${newDataType} (${newType})`);
      
      // Check existing data
      console.log(`   📊 Existing data in this column:`);
      records.forEach((record, index) => {
        const value = record.data[columnToChange.name];
        console.log(`      Record ${index + 1}: "${value}" (type: ${typeof value})`);
      });
      
      // Update column type using the controller logic
      await columnToChange.update({
        data_type: newDataType,
        type: newType
      });
      
      console.log(`   ✅ Column type updated in database`);
      
      // Update Metabase table structure
      try {
        const { createMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
        await createMetabaseTable(tableId, table.name, null, databaseId);
        console.log(`   ✅ Metabase table structure updated with new column type`);
      } catch (metabaseError) {
        console.log(`   ❌ Metabase update failed: ${metabaseError.message}`);
      }
    } else {
      console.log(`   ⚠️ Column "New Test Column" not found, skipping type change test`);
    }
    
    // ===== TEST 2: CHANGE COLUMN TYPE TO FORMULA =====
    console.log('\n📝 TEST 2: Changing column type to formula...');
    
    const columnForFormula = columns.find(col => col.name === 'Renamed Abc Column');
    if (columnForFormula) {
      const oldDataType = columnForFormula.data_type;
      const oldType = columnForFormula.type;
      const newDataType = 'formula';
      const newType = 'string'; // Formula results are typically strings
      
      console.log(`   📝 Changing column "${columnForFormula.name}" from ${oldDataType} (${oldType}) to ${newDataType} (${newType})`);
      
      // Create formula config
      const formulaConfig = {
        formula: 'CONCAT("Hello ", "World")', // Simple formula
        resultType: 'string'
      };
      
      // Update column with formula config
      await columnForFormula.update({
        data_type: newDataType,
        type: newType,
        formula_config: formulaConfig
      });
      
      console.log(`   ✅ Column updated with formula config`);
      
      // Update Metabase table structure
      try {
        const { createMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
        await createMetabaseTable(tableId, table.name, null, databaseId);
        console.log(`   ✅ Metabase table structure updated with formula column`);
      } catch (metabaseError) {
        console.log(`   ❌ Metabase update failed: ${metabaseError.message}`);
      }
    } else {
      console.log(`   ⚠️ Column "Renamed Abc Column" not found, skipping formula test`);
    }
    
    // ===== TEST 3: CHANGE COLUMN TYPE TO CHECKBOX =====
    console.log('\n📝 TEST 3: Changing column type to checkbox...');
    
    const columnForCheckbox = columns.find(col => col.name === 'Test Column 3');
    if (columnForCheckbox) {
      const oldDataType = columnForCheckbox.data_type;
      const oldType = columnForCheckbox.type;
      const newDataType = 'checkbox';
      const newType = 'boolean';
      
      console.log(`   📝 Changing column "${columnForCheckbox.name}" from ${oldDataType} (${oldType}) to ${newDataType} (${newType})`);
      
      // Check existing data
      console.log(`   📊 Existing data in this column:`);
      records.forEach((record, index) => {
        const value = record.data[columnForCheckbox.name];
        console.log(`      Record ${index + 1}: "${value}" (type: ${typeof value})`);
      });
      
      // Update column type
      await columnForCheckbox.update({
        data_type: newDataType,
        type: newType
      });
      
      console.log(`   ✅ Column type updated in database`);
      
      // Update Metabase table structure
      try {
        const { createMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
        await createMetabaseTable(tableId, table.name, null, databaseId);
        console.log(`   ✅ Metabase table structure updated with checkbox column`);
      } catch (metabaseError) {
        console.log(`   ❌ Metabase update failed: ${metabaseError.message}`);
      }
    } else {
      console.log(`   ⚠️ Column "Test Column 3" not found, skipping checkbox test`);
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
      console.log(`   ${index + 1}. ${col.name} (${col.data_type}) - Type: ${col.type}`);
      if (col.formula_config) {
        console.log(`      Formula: ${col.formula_config.formula}`);
      }
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
        LIMIT 3
      `);
      
      console.log(`📊 Sample Metabase records (${metabaseRecords.length}):`);
      metabaseRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}`);
        // Show all columns dynamically
        Object.keys(record).forEach(key => {
          if (!['id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at'].includes(key)) {
            console.log(`      ${key}: "${record[key] || '[null]'}" (type: ${typeof record[key]})`);
          }
        });
      });
    }
    
    console.log('\n🎉 Improved column type changes test completed!');
    
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
testImprovedColumnTypeChanges();


