import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing Simple Update Record...');

async function testSimpleUpdateRecord() {
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
    
    console.log(`\n📋 Current columns (${columns.length}):`);
    columns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name} (${col.data_type}) - Type: ${col.type} - Required: ${col.is_required}`);
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
    
    // ===== TEST: SIMPLE VALID UPDATE =====
    console.log('\n📝 TEST: Testing simple valid update...');
    
    const recordToUpdate = records[1]; // Use second record
    if (recordToUpdate) {
      console.log(`   📝 Testing with record: ${recordToUpdate.id}`);
      console.log(`   📊 Current data:`, recordToUpdate.data);
      
      // Test with valid data
      const validData = {
        'Test New Column': 'Simple Update Test',
        'Renamed Abc Column': 'Updated via Simple Test'
      };
      
      console.log(`   📊 New data:`, validData);
      
      try {
        // Simulate the validation logic from recordControllerSimple.js
        console.log(`   📝 Simulating validation...`);
        
        // Check if data is valid
        if (!validData || typeof validData !== 'object') {
          console.log(`   ❌ Data validation failed: Data must be an object`);
          return;
        }
        
        // Get table columns for validation
        const validationColumns = await Column.findAll({
          where: { table_id: recordToUpdate.table_id },
          order: [['order', 'ASC']]
        });
        
        // Validate data against column definitions
        const validatedData = {};
        for (const column of validationColumns) {
          const value = validData[column.name];
          
          // Check required fields
          if (column.is_required && (value === undefined || value === null || value === '')) {
            console.log(`   ❌ Validation failed: Column '${column.name}' is required`);
            return;
          }

          // Validate email format for email data type
          if (column.data_type === 'email' && value && value !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              console.log(`   ❌ Validation failed: Invalid email format for column '${column.name}'`);
              return;
            }
          }

          // Validate phone format for phone data type
          if (column.data_type === 'phone' && value && value !== '') {
            const phoneRegex = /^[\+]?[0-9][\d]{6,15}$/;
            const cleanPhone = value.replace(/[\s\-\(\)\.]/g, '');
            if (!phoneRegex.test(cleanPhone)) {
              console.log(`   ❌ Validation failed: Invalid phone number format for column '${column.name}'`);
              return;
            }
          }

          // Validate number format for number data types
          if (['number', 'currency', 'percent', 'rating'].includes(column.data_type) && value && value !== '') {
            const numValue = Number(value);
            if (isNaN(numValue)) {
              console.log(`   ❌ Validation failed: Invalid number value for column '${column.name}'`);
              return;
            }
          }

          // Validate date format for date data types
          if (['date', 'datetime'].includes(column.data_type) && value && value !== '') {
            const dateValue = new Date(value);
            if (isNaN(dateValue.getTime())) {
              console.log(`   ❌ Validation failed: Invalid date value for column '${column.name}'`);
              return;
            }
          }

          // Only include fields that exist in column definitions
          if (value !== undefined) {
            validatedData[column.name] = value;
          }
        }

        // Check for fields that don't exist in column definitions
        const columnNames = validationColumns.map(col => col.name);
        for (const fieldName of Object.keys(validData)) {
          if (!columnNames.includes(fieldName)) {
            console.log(`   ❌ Validation failed: Field '${fieldName}' does not exist in table columns`);
            return;
          }
        }

        console.log(`   ✅ Validation passed`);
        console.log(`   📊 Validated data:`, validatedData);
        
        // Update record
        await recordToUpdate.update({
          data: validatedData
        });
        
        console.log(`   ✅ Record updated successfully`);
        
        // Update Metabase table
        try {
          const { updateMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
          const metabaseRecord = {
            id: recordToUpdate.id,
            table_id: recordToUpdate.table_id,
            user_id: recordToUpdate.user_id,
            site_id: recordToUpdate.site_id,
            data: recordToUpdate.data,
            created_at: recordToUpdate.created_at,
            updated_at: recordToUpdate.updated_at
          };
          
          await updateMetabaseTable(recordToUpdate.table_id, metabaseRecord, 'update', [], table.database_id);
          console.log(`   ✅ Metabase sync successful`);
        } catch (metabaseError) {
          console.log(`   ❌ Metabase sync failed: ${metabaseError.message}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Update failed: ${error.message}`);
      }
    } else {
      console.log(`   ⚠️ No records found to test`);
    }
    
    // ===== FINAL VERIFICATION =====
    console.log('\n🔍 FINAL VERIFICATION...');
    
    // Check updated record
    const finalRecord = await Record.findByPk(recordToUpdate.id);
    if (finalRecord) {
      console.log(`\n📊 Final record data:`);
      console.log(`   ID: ${finalRecord.id}`);
      console.log(`   Data:`, finalRecord.data);
    }
    
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
      
      const [metabaseRecords] = await sequelize.query(`
        SELECT * FROM "${schemaName}"."${metabaseTableName}"
        WHERE id = '${recordToUpdate.id}'
      `);
      
      if (metabaseRecords.length > 0) {
        console.log(`📊 Metabase record data:`);
        const metabaseRecord = metabaseRecords[0];
        Object.keys(metabaseRecord).forEach(key => {
          if (!['id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at'].includes(key)) {
            console.log(`   ${key}: "${metabaseRecord[key] || '[null]'}"`);
          }
        });
      } else {
        console.log(`❌ Record not found in Metabase table`);
      }
    }
    
    console.log('\n🎉 Simple update record test completed!');
    
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
testSimpleUpdateRecord();


