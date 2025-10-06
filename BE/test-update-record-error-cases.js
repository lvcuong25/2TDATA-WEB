import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing Update Record Error Cases...');

async function testUpdateRecordErrorCases() {
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
    
    // ===== TEST 1: UPDATE WITH INVALID DATA TYPES =====
    console.log('\n📝 TEST 1: Testing update with invalid data types...');
    
    const recordToUpdate = records[0];
    if (recordToUpdate) {
      console.log(`   📝 Testing with record: ${recordToUpdate.id}`);
      
      // Test 1.1: Invalid number for number column
      const numberColumn = columns.find(col => col.data_type === 'number');
      if (numberColumn) {
        console.log(`   📝 Testing invalid number for column: ${numberColumn.name}`);
        
        const invalidData = {
          ...recordToUpdate.data,
          [numberColumn.name]: 'This is not a number'
        };
        
        try {
          await recordToUpdate.update({
            data: invalidData
          });
          console.log(`   ⚠️ Invalid number was accepted (this might be a problem)`);
        } catch (error) {
          console.log(`   ✅ Invalid number was rejected: ${error.message}`);
        }
      }
      
      // Test 1.2: Invalid email format
      const emailColumn = columns.find(col => col.data_type === 'email');
      if (emailColumn) {
        console.log(`   📝 Testing invalid email for column: ${emailColumn.name}`);
        
        const invalidData = {
          ...recordToUpdate.data,
          [emailColumn.name]: 'not-an-email'
        };
        
        try {
          await recordToUpdate.update({
            data: invalidData
          });
          console.log(`   ⚠️ Invalid email was accepted (this might be a problem)`);
        } catch (error) {
          console.log(`   ✅ Invalid email was rejected: ${error.message}`);
        }
      }
    }
    
    // ===== TEST 2: UPDATE WITH MISSING REQUIRED FIELDS =====
    console.log('\n📝 TEST 2: Testing update with missing required fields...');
    
    const requiredColumns = columns.filter(col => col.is_required);
    if (requiredColumns.length > 0) {
      console.log(`   📝 Found ${requiredColumns.length} required columns:`);
      requiredColumns.forEach(col => {
        console.log(`      - ${col.name} (${col.data_type})`);
      });
      
      const recordToUpdate = records[0];
      if (recordToUpdate) {
        console.log(`   📝 Testing with record: ${recordToUpdate.id}`);
        
        // Remove required field
        const requiredColumn = requiredColumns[0];
        const dataWithoutRequired = { ...recordToUpdate.data };
        delete dataWithoutRequired[requiredColumn.name];
        
        console.log(`   📝 Removing required field: ${requiredColumn.name}`);
        console.log(`   📊 Data without required field:`, dataWithoutRequired);
        
        try {
          await recordToUpdate.update({
            data: dataWithoutRequired
          });
          console.log(`   ⚠️ Record updated without required field (this might be a problem)`);
        } catch (error) {
          console.log(`   ✅ Record update rejected due to missing required field: ${error.message}`);
        }
      }
    } else {
      console.log(`   📝 No required columns found`);
    }
    
    // ===== TEST 3: UPDATE WITH NON-EXISTENT COLUMNS =====
    console.log('\n📝 TEST 3: Testing update with non-existent columns...');
    
    const recordToUpdate3 = records[0];
    if (recordToUpdate3) {
      console.log(`   📝 Testing with record: ${recordToUpdate3.id}`);
      
      const dataWithNonExistentColumn = {
        ...recordToUpdate3.data,
        'NonExistentColumn': 'Some Value'
      };
      
      console.log(`   📝 Adding non-existent column: NonExistentColumn`);
      console.log(`   📊 Data with non-existent column:`, dataWithNonExistentColumn);
      
      try {
        await recordToUpdate3.update({
          data: dataWithNonExistentColumn
        });
        console.log(`   ⚠️ Record updated with non-existent column (this might be a problem)`);
      } catch (error) {
        console.log(`   ✅ Record update rejected due to non-existent column: ${error.message}`);
      }
    }
    
    // ===== TEST 4: UPDATE WITH NULL/UNDEFINED VALUES =====
    console.log('\n📝 TEST 4: Testing update with null/undefined values...');
    
    const recordToUpdate4 = records[0];
    if (recordToUpdate4) {
      console.log(`   📝 Testing with record: ${recordToUpdate4.id}`);
      
      const dataWithNullValues = {
        ...recordToUpdate4.data,
        'Test New Column': null,
        'Renamed Abc Column': undefined
      };
      
      console.log(`   📝 Setting some fields to null/undefined`);
      console.log(`   📊 Data with null/undefined values:`, dataWithNullValues);
      
      try {
        await recordToUpdate4.update({
          data: dataWithNullValues
        });
        console.log(`   ✅ Record updated with null/undefined values`);
      } catch (error) {
        console.log(`   ❌ Record update failed with null/undefined values: ${error.message}`);
      }
    }
    
    // ===== TEST 5: UPDATE WITH EMPTY DATA OBJECT =====
    console.log('\n📝 TEST 5: Testing update with empty data object...');
    
    const recordToUpdate5 = records[0];
    if (recordToUpdate5) {
      console.log(`   📝 Testing with record: ${recordToUpdate5.id}`);
      
      try {
        await recordToUpdate5.update({
          data: {}
        });
        console.log(`   ✅ Record updated with empty data object`);
      } catch (error) {
        console.log(`   ❌ Record update failed with empty data object: ${error.message}`);
      }
    }
    
    // ===== TEST 6: UPDATE WITH INVALID RECORD ID =====
    console.log('\n📝 TEST 6: Testing update with invalid record ID...');
    
    try {
      const invalidRecord = await Record.findByPk('invalid-id');
      if (invalidRecord) {
        console.log(`   ⚠️ Invalid record ID was found (this should not happen)`);
      } else {
        console.log(`   ✅ Invalid record ID correctly returns null`);
      }
    } catch (error) {
      console.log(`   ✅ Invalid record ID correctly throws error: ${error.message}`);
    }
    
    // ===== FINAL VERIFICATION =====
    console.log('\n🔍 FINAL VERIFICATION...');
    
    // Check final record state
    const finalRecord = await Record.findByPk(records[0].id);
    if (finalRecord) {
      console.log(`\n📊 Final record data:`);
      console.log(`   ID: ${finalRecord.id}`);
      console.log(`   Data:`, finalRecord.data);
    }
    
    console.log('\n🎉 Update record error cases test completed!');
    
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
testUpdateRecordErrorCases();
