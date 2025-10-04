import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

console.log('🔍 Testing API Update Record...');

async function testApiUpdateRecord() {
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
    
    // ===== TEST 1: VALID UPDATE =====
    console.log('\n📝 TEST 1: Testing valid update...');
    
    const recordToUpdate = records[1]; // Use second record (first one is empty)
    if (recordToUpdate) {
      console.log(`   📝 Testing with record: ${recordToUpdate.id}`);
      
      const validData = {
        'Test New Column': 'Updated via API',
        'Renamed Abc Column': 'Hello World Updated'
      };
      
      console.log(`   📊 Valid data:`, validData);
      
      try {
        const response = await axios.put(`http://localhost:5000/api/records/simple/${recordToUpdate.id}`, {
          data: validData
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token' // You might need to adjust this
          }
        });
        
        console.log(`   ✅ Valid update successful:`, response.data);
      } catch (error) {
        console.log(`   ❌ Valid update failed:`, error.response?.data || error.message);
      }
    }
    
    // ===== TEST 2: INVALID NUMBER =====
    console.log('\n📝 TEST 2: Testing invalid number...');
    
    if (recordToUpdate) {
      const numberColumn = columns.find(col => col.data_type === 'number');
      if (numberColumn) {
        console.log(`   📝 Testing invalid number for column: ${numberColumn.name}`);
        
        const invalidData = {
          [numberColumn.name]: 'This is not a number'
        };
        
        console.log(`   📊 Invalid data:`, invalidData);
        
        try {
          const response = await axios.put(`http://localhost:5000/api/records/simple/${recordToUpdate.id}`, {
            data: invalidData
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token'
            }
          });
          
          console.log(`   ⚠️ Invalid number was accepted:`, response.data);
        } catch (error) {
          console.log(`   ✅ Invalid number was rejected:`, error.response?.data || error.message);
        }
      }
    }
    
    // ===== TEST 3: NON-EXISTENT COLUMN =====
    console.log('\n📝 TEST 3: Testing non-existent column...');
    
    if (recordToUpdate) {
      const invalidData = {
        'NonExistentColumn': 'Some Value'
      };
      
      console.log(`   📊 Invalid data:`, invalidData);
      
      try {
        const response = await axios.put(`http://localhost:5000/api/records/simple/${recordToUpdate.id}`, {
          data: invalidData
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        });
        
        console.log(`   ⚠️ Non-existent column was accepted:`, response.data);
      } catch (error) {
        console.log(`   ✅ Non-existent column was rejected:`, error.response?.data || error.message);
      }
    }
    
    // ===== TEST 4: EMPTY DATA OBJECT =====
    console.log('\n📝 TEST 4: Testing empty data object...');
    
    if (recordToUpdate) {
      try {
        const response = await axios.put(`http://localhost:5000/api/records/simple/${recordToUpdate.id}`, {
          data: {}
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        });
        
        console.log(`   ✅ Empty data object was accepted:`, response.data);
      } catch (error) {
        console.log(`   ❌ Empty data object was rejected:`, error.response?.data || error.message);
      }
    }
    
    // ===== TEST 5: INVALID RECORD ID =====
    console.log('\n📝 TEST 5: Testing invalid record ID...');
    
    try {
      const response = await axios.put(`http://localhost:5000/api/records/simple/invalid-id`, {
        data: { 'Test New Column': 'Test' }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      
      console.log(`   ⚠️ Invalid record ID was accepted:`, response.data);
    } catch (error) {
      console.log(`   ✅ Invalid record ID was rejected:`, error.response?.data || error.message);
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
    
    console.log('\n🎉 API update record test completed!');
    
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
testApiUpdateRecord();


