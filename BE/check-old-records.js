/**
 * Check if there are old records containing deleted column data
 */

import mongoose from 'mongoose';
import { sequelize, Record as PostgresRecord, Column as PostgresColumn } from './src/models/postgres/index.js';

const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';

console.log('🔍 Checking for old records with deleted column data...');

// Connect to databases
async function connectDatabases() {
  try {
    await mongoose.connect('mongodb://localhost:27017/2tdata', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Check all records in the table
async function checkAllRecords() {
  console.log(`\n📝 CHECK: All records in table ${tableId}...`);
  
  try {
    const records = await PostgresRecord.findAll({
      where: { table_id: tableId },
      order: [['created_at', 'ASC']]
    });
    
    console.log(`   📊 Found ${records.length} records:`);
    
    records.forEach((record, index) => {
      console.log(`\n   ${index + 1}. Record ${record.id}:`);
      console.log(`      Data:`, JSON.stringify(record.data, null, 6));
      console.log(`      Created: ${record.created_at}`);
      console.log(`      Updated: ${record.updated_at}`);
    });
    
    // Check if any record has 'Renamed Abc Column' data
    const recordsWithOldColumn = records.filter(record => 
      record.data && record.data['Renamed Abc Column'] !== undefined
    );
    
    console.log(`\n   🔍 Records containing "Renamed Abc Column": ${recordsWithOldColumn.length}`);
    
    if (recordsWithOldColumn.length > 0) {
      console.log('   ⚠️ Found records with old column data:');
      recordsWithOldColumn.forEach(record => {
        console.log(`      Record ID: ${record.id}`);
        console.log(`      Data:`, JSON.stringify(record.data, null, 6));
      });
    } else {
      console.log('   ✅ No records contain the deleted column data');
    }
    
    return recordsWithOldColumn;
    
  } catch (error) {
    console.log(`   ❌ Error checking records:`, error.message);
    return [];
  }
}

// Check column history
async function checkColumnHistory() {
  console.log(`\n📝 CHECK: Column history...`);
  
  try {
    const columns = await PostgresColumn.findAll({
      where: { table_id: tableId },
      order: [['created_at', 'ASC']]
    });
    
    console.log(`   📊 Current columns (${columns.length}):`);
    columns.forEach((col, index) => {
      console.log(`      ${index + 1}. ${col.name} (${col.data_type}) - Created: ${col.created_at}`);
    });
    
    // Check if there are any soft-deleted columns or column history
    console.log(`\n   🔍 Checking for column history...`);
    // Note: This would require a column history table or soft delete mechanism
    
  } catch (error) {
    console.log(`   ❌ Error checking columns:`, error.message);
  }
}

// Check specific record that's being updated
async function checkSpecificRecord() {
  console.log(`\n📝 CHECK: Specific record being updated...`);
  
  const recordId = 'c9aaaa44-56ba-406d-87df-0eed472c912c';
  
  try {
    const record = await PostgresRecord.findByPk(recordId);
    
    if (record) {
      console.log(`   📊 Record ${recordId}:`);
      console.log(`      Data:`, JSON.stringify(record.data, null, 6));
      console.log(`      Created: ${record.created_at}`);
      console.log(`      Updated: ${record.updated_at}`);
      
      // Check if this record has old column data
      if (record.data && record.data['Renamed Abc Column'] !== undefined) {
        console.log(`   ⚠️ This record contains old column data!`);
        console.log(`      Old column value: "${record.data['Renamed Abc Column']}"`);
      } else {
        console.log(`   ✅ This record does not contain old column data`);
      }
    } else {
      console.log(`   ❌ Record ${recordId} not found`);
    }
    
  } catch (error) {
    console.log(`   ❌ Error checking specific record:`, error.message);
  }
}

// Main function
async function checkOldRecords() {
  try {
    await connectDatabases();
    
    const recordsWithOldData = await checkAllRecords();
    await checkColumnHistory();
    await checkSpecificRecord();
    
    console.log('\n🎉 Old Records Check Summary:');
    if (recordsWithOldData.length > 0) {
      console.log(`   ⚠️ Found ${recordsWithOldData.length} records with old column data`);
      console.log('   📝 This explains why frontend is sending old column names');
      console.log('   💡 Solution: Clean up old data or handle it gracefully');
    } else {
      console.log('   ✅ No old column data found in records');
      console.log('   📝 Frontend issue might be elsewhere (cached form state, etc.)');
    }
    
  } catch (error) {
    console.error('❌ Check execution failed:', error);
  } finally {
    await mongoose.connection.close();
    await sequelize.close();
    console.log('\n📡 Database connections closed');
  }
}

// Run the check
checkOldRecords();


