import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

console.log('🔍 Testing Wrapper Function...');

async function testWrapperFunction() {
  try {
    console.log('📡 Connecting to databases...');
    
    // Connect to databases
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    const recordId = 'c9aaaa44-56ba-406d-87df-0eed472c912c';
    
    console.log(`\n🔍 Testing Record ID: ${recordId}`);
    
    // ===== TEST: API CALL WITH WRAPPER FUNCTION =====
    console.log('\n📝 TEST: Testing API call with wrapper function...');
    
    const validData = {
      'Test New Column': 'Wrapper Function Test',
      'Renamed Abc Column': 'Updated via Wrapper Function'
    };
    
    console.log(`   📊 Data to update:`, validData);
    
    try {
      const response = await axios.put(`http://localhost:3004/api/database/records/${recordId}`, {
        data: validData
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      
      console.log(`   ✅ Wrapper function successful:`, response.data);
    } catch (error) {
      console.log(`   ❌ Wrapper function failed:`, error.response?.data || error.message);
      
      if (error.response?.status === 500) {
        console.log(`   📝 Still getting 500 error - wrapper function might not be working yet`);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        console.log(`   📝 Authentication/Authorization error - wrapper function is working but needs proper auth`);
      } else if (error.response?.status === 400) {
        console.log(`   📝 Validation error - wrapper function is working, data validation is working`);
      } else {
        console.log(`   📝 Other error - wrapper function might be working`);
      }
    }
    
    // ===== TEST: Multiple records =====
    console.log('\n📝 TEST: Testing multiple records with wrapper function...');
    
    const recordIds = [
      'edd49066-465e-4363-adea-6396a0e9a6ef',
      '67654f4c-8958-4859-8d2f-0b876b6c288d',
      'a202b17c-4f84-4551-8f6b-29b1e80de5a0'
    ];
    
    for (const testRecordId of recordIds) {
      console.log(`   📝 Testing record: ${testRecordId}`);
      
      const testData = {
        'Test New Column': `Wrapper Test ${testRecordId.slice(-4)}`
      };
      
      try {
        const response = await axios.put(`http://localhost:3004/api/database/records/${testRecordId}`, {
          data: testData
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        });
        
        console.log(`   ✅ Record ${testRecordId}: Success`);
      } catch (error) {
        console.log(`   ❌ Record ${testRecordId}: ${error.response?.status || 'Error'} - ${error.response?.data?.message || error.message}`);
      }
    }
    
    // ===== VERIFICATION =====
    console.log('\n🔍 VERIFICATION...');
    
    // Check if records were updated
    for (const testRecordId of recordIds) {
      const record = await Record.findByPk(testRecordId);
      if (record) {
        console.log(`\n📊 Record ${testRecordId} data:`);
        console.log(`   Data:`, record.data);
      }
    }
    
    console.log('\n🎉 Wrapper function test completed!');
    
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
testWrapperFunction();
