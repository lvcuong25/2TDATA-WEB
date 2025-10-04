import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

console.log('🔍 Testing Route Fix...');

async function testRouteFix() {
  try {
    console.log('📡 Connecting to databases...');
    
    // Connect to databases
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    const recordId = 'c9aaaa44-56ba-406d-87df-0eed472c912c';
    
    console.log(`\n🔍 Testing Record ID: ${recordId}`);
    
    // ===== TEST: API CALL TO FIXED ROUTE =====
    console.log('\n📝 TEST: Testing API call to fixed route...');
    
    const validData = {
      'Test New Column': 'Route Fix Test',
      'Renamed Abc Column': 'Updated via Route Fix'
    };
    
    console.log(`   📊 Data to update:`, validData);
    
    try {
      const response = await axios.put(`http://localhost:5000/api/database/records/${recordId}`, {
        data: validData
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      
      console.log(`   ✅ Route fix successful:`, response.data);
    } catch (error) {
      console.log(`   ❌ Route fix failed:`, error.response?.data || error.message);
      
      if (error.response?.status === 500) {
        console.log(`   📝 Still getting 500 error - route order might not be fixed yet`);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        console.log(`   📝 Authentication/Authorization error - route is working but needs proper auth`);
      } else {
        console.log(`   📝 Other error - route might be working`);
      }
    }
    
    // ===== VERIFICATION =====
    console.log('\n🔍 VERIFICATION...');
    
    // Check if record was updated
    const record = await Record.findByPk(recordId);
    if (record) {
      console.log(`\n📊 Record data after test:`);
      console.log(`   ID: ${record.id}`);
      console.log(`   Data:`, record.data);
    }
    
    console.log('\n🎉 Route fix test completed!');
    
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
testRouteFix();


