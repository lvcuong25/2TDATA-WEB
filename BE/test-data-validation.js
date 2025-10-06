import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing Data Validation...');

async function testDataValidation() {
  try {
    console.log('📡 Connecting to databases...');
    
    // Connect to databases
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
    
    console.log(`\n🔍 Testing with Table: ${tableId}`);
    
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
      console.log(`   ${index + 1}. ${col.name} (${col.data_type}) - required: ${col.is_required}`);
    });
    
    // ===== TEST 1: VALID DATA =====
    console.log('\n📝 TEST 1: Creating record with valid data...');
    
    const validData = {
      'Abc': 'Valid Test Record',
      'Test Column': 'Valid Test Data',
      'Test Column 3': 456
    };
    
    try {
      const validRecord = await Record.create({
        table_id: tableId,
        user_id: '68d6be17362e0b14adfa4367',
        site_id: 'test-site',
        data: validData
      });
      
      console.log(`   ✅ Valid record created: ${validRecord.id}`);
      console.log(`   📊 Data:`, validData);
    } catch (error) {
      console.log(`   ❌ Valid record creation failed: ${error.message}`);
    }
    
    // ===== TEST 2: INVALID DATA (NON-EXISTENT COLUMN) =====
    console.log('\n📝 TEST 2: Creating record with invalid data (non-existent column)...');
    
    const invalidData = {
      'Abc': 'Invalid Test Record',
      'xyz': 'This column does not exist',
      'Test Column': 'Valid Test Data'
    };
    
    try {
      const invalidRecord = await Record.create({
        table_id: tableId,
        user_id: '68d6be17362e0b14adfa4367',
        site_id: 'test-site',
        data: invalidData
      });
      
      console.log(`   ⚠️ Invalid record created (should not happen): ${invalidRecord.id}`);
      console.log(`   📊 Data:`, invalidData);
    } catch (error) {
      console.log(`   ✅ Invalid record creation properly rejected: ${error.message}`);
    }
    
    // ===== TEST 3: INVALID DATA (WRONG DATA TYPE) =====
    console.log('\n📝 TEST 3: Creating record with invalid data (wrong data type)...');
    
    const wrongTypeData = {
      'Abc': 'Wrong Type Test Record',
      'Test Column': 'Valid Test Data',
      'Test Column 3': 'This should be a number' // This is a string, but column expects number
    };
    
    try {
      const wrongTypeRecord = await Record.create({
        table_id: tableId,
        user_id: '68d6be17362e0b14adfa4367',
        site_id: 'test-site',
        data: wrongTypeData
      });
      
      console.log(`   ⚠️ Wrong type record created (should not happen): ${wrongTypeRecord.id}`);
      console.log(`   📊 Data:`, wrongTypeData);
    } catch (error) {
      console.log(`   ✅ Wrong type record creation properly rejected: ${error.message}`);
    }
    
    // ===== FINAL VERIFICATION =====
    console.log('\n🔍 FINAL VERIFICATION...');
    
    const finalRecords = await Record.findAll({
      where: { table_id: tableId },
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    console.log(`📊 Recent records in PostgreSQL:`);
    finalRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id}`);
      console.log(`      Abc: "${record.data?.Abc || '[null]'}"`);
      console.log(`      Test Column: "${record.data?.['Test Column'] || '[null]'}"`);
      console.log(`      Test Column 3: "${record.data?.['Test Column 3'] || '[null]'}"`);
      console.log(`      Created: ${record.created_at}`);
    });
    
    console.log('\n🎉 Data validation test completed!');
    
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
testDataValidation();



