/**
 * Test script to verify if records are updated when columns are modified or deleted
 */

import mongoose from 'mongoose';
import { sequelize, Record as PostgresRecord, Column as PostgresColumn, Table as PostgresTable } from './src/models/postgres/index.js';

const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';

console.log('🔍 Testing Column Changes Sync with Records...');

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

// Get current state
async function getCurrentState() {
  console.log(`\n📝 CURRENT STATE: Table ${tableId}...`);
  
  try {
    // Get current columns
    const columns = await PostgresColumn.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });
    
    console.log(`   📋 Current columns (${columns.length}):`);
    columns.forEach((col, index) => {
      console.log(`      ${index + 1}. ${col.name} (${col.data_type}) - ID: ${col.id}`);
    });
    
    // Get all records
    const records = await PostgresRecord.findAll({
      where: { table_id: tableId },
      order: [['created_at', 'ASC']]
    });
    
    console.log(`   📊 Current records (${records.length}):`);
    records.forEach((record, index) => {
      console.log(`      ${index + 1}. Record ${record.id}:`);
      console.log(`         Data:`, JSON.stringify(record.data, null, 8));
    });
    
    return { columns, records };
    
  } catch (error) {
    console.log(`   ❌ Error getting current state:`, error.message);
    return { columns: [], records: [] };
  }
}

// Test 1: Rename a column
async function testColumnRename(columns, records) {
  console.log(`\n📝 TEST 1: Rename column...`);
  
  if (columns.length === 0) {
    console.log(`   ⚠️ No columns to rename`);
    return;
  }
  
  const columnToRename = columns[0];
  const oldName = columnToRename.name;
  const newName = `${oldName}_Renamed_${Date.now()}`;
  
  console.log(`   🔄 Renaming column: "${oldName}" → "${newName}"`);
  
  try {
    // Update column name
    await columnToRename.update({ name: newName });
    console.log(`   ✅ Column renamed successfully`);
    
    // Check if records still have old column name
    const updatedRecords = await PostgresRecord.findAll({
      where: { table_id: tableId }
    });
    
    let recordsWithOldName = 0;
    let recordsWithNewName = 0;
    
    updatedRecords.forEach(record => {
      if (record.data && record.data[oldName] !== undefined) {
        recordsWithOldName++;
      }
      if (record.data && record.data[newName] !== undefined) {
        recordsWithNewName++;
      }
    });
    
    console.log(`   📊 Records with old name "${oldName}": ${recordsWithOldName}`);
    console.log(`   📊 Records with new name "${newName}": ${recordsWithNewName}`);
    
    if (recordsWithOldName > 0) {
      console.log(`   ⚠️ Records still contain old column name - NOT SYNCED`);
    } else {
      console.log(`   ✅ Records do not contain old column name - SYNCED`);
    }
    
    // Restore original name
    await columnToRename.update({ name: oldName });
    console.log(`   🔄 Restored original column name`);
    
  } catch (error) {
    console.log(`   ❌ Error during column rename test:`, error.message);
  }
}

// Test 2: Change column data type
async function testColumnDataTypeChange(columns, records) {
  console.log(`\n📝 TEST 2: Change column data type...`);
  
  if (columns.length === 0) {
    console.log(`   ⚠️ No columns to modify`);
    return;
  }
  
  const columnToModify = columns.find(col => col.data_type === 'text');
  if (!columnToModify) {
    console.log(`   ⚠️ No text column found to modify`);
    return;
  }
  
  const oldType = columnToModify.data_type;
  const newType = 'number';
  
  console.log(`   🔄 Changing column "${columnToModify.name}" type: "${oldType}" → "${newType}"`);
  
  try {
    // Update column data type
    await columnToModify.update({ data_type: newType });
    console.log(`   ✅ Column data type changed successfully`);
    
    // Check if records have compatible data
    const updatedRecords = await PostgresRecord.findAll({
      where: { table_id: tableId }
    });
    
    let recordsWithIncompatibleData = 0;
    
    updatedRecords.forEach(record => {
      if (record.data && record.data[columnToModify.name] !== undefined) {
        const value = record.data[columnToModify.name];
        if (value !== '' && isNaN(Number(value))) {
          recordsWithIncompatibleData++;
          console.log(`      ⚠️ Record ${record.id} has incompatible data: "${value}"`);
        }
      }
    });
    
    console.log(`   📊 Records with incompatible data: ${recordsWithIncompatibleData}`);
    
    if (recordsWithIncompatibleData > 0) {
      console.log(`   ⚠️ Some records have incompatible data - NOT SYNCED`);
    } else {
      console.log(`   ✅ All records have compatible data - SYNCED`);
    }
    
    // Restore original data type
    await columnToModify.update({ data_type: oldType });
    console.log(`   🔄 Restored original column data type`);
    
  } catch (error) {
    console.log(`   ❌ Error during column data type change test:`, error.message);
  }
}

// Test 3: Delete a column
async function testColumnDeletion(columns, records) {
  console.log(`\n📝 TEST 3: Delete column...`);
  
  if (columns.length <= 1) {
    console.log(`   ⚠️ Not enough columns to delete (need at least 2)`);
    return;
  }
  
  const columnToDelete = columns[columns.length - 1]; // Delete last column
  const columnName = columnToDelete.name;
  
  console.log(`   🗑️ Deleting column: "${columnName}"`);
  
  try {
    // Check records before deletion
    const recordsBefore = await PostgresRecord.findAll({
      where: { table_id: tableId }
    });
    
    let recordsWithColumnData = 0;
    recordsBefore.forEach(record => {
      if (record.data && record.data[columnName] !== undefined) {
        recordsWithColumnData++;
      }
    });
    
    console.log(`   📊 Records with data for "${columnName}": ${recordsWithColumnData}`);
    
    // Delete column
    await columnToDelete.destroy();
    console.log(`   ✅ Column deleted successfully`);
    
    // Check records after deletion
    const recordsAfter = await PostgresRecord.findAll({
      where: { table_id: tableId }
    });
    
    let recordsStillWithColumnData = 0;
    recordsAfter.forEach(record => {
      if (record.data && record.data[columnName] !== undefined) {
        recordsStillWithColumnData++;
        console.log(`      ⚠️ Record ${record.id} still has data for deleted column:`, record.data[columnName]);
      }
    });
    
    console.log(`   📊 Records still with deleted column data: ${recordsStillWithColumnData}`);
    
    if (recordsStillWithColumnData > 0) {
      console.log(`   ⚠️ Records still contain deleted column data - NOT SYNCED`);
    } else {
      console.log(`   ✅ Records do not contain deleted column data - SYNCED`);
    }
    
    // Note: We don't restore the deleted column as it's a destructive test
    
  } catch (error) {
    console.log(`   ❌ Error during column deletion test:`, error.message);
  }
}

// Test 4: Add a new column
async function testColumnAddition(columns, records) {
  console.log(`\n📝 TEST 4: Add new column...`);
  
  const newColumnName = `Test_Column_${Date.now()}`;
  
  console.log(`   ➕ Adding new column: "${newColumnName}"`);
  
  try {
    // Add new column
    const newColumn = await PostgresColumn.create({
      id: require('crypto').randomUUID(),
      table_id: tableId,
      name: newColumnName,
      key: newColumnName.toLowerCase().replace(/\s+/g, '_'),
      data_type: 'text',
      is_required: false,
      is_unique: false,
      order: columns.length + 1,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    console.log(`   ✅ New column added successfully`);
    
    // Check if records have data for new column
    const updatedRecords = await PostgresRecord.findAll({
      where: { table_id: tableId }
    });
    
    let recordsWithNewColumnData = 0;
    updatedRecords.forEach(record => {
      if (record.data && record.data[newColumnName] !== undefined) {
        recordsWithNewColumnData++;
      }
    });
    
    console.log(`   📊 Records with data for new column: ${recordsWithNewColumnData}`);
    
    if (recordsWithNewColumnData > 0) {
      console.log(`   ⚠️ Some records have data for new column - UNEXPECTED`);
    } else {
      console.log(`   ✅ No records have data for new column - EXPECTED`);
    }
    
    // Clean up - delete the test column
    await newColumn.destroy();
    console.log(`   🧹 Cleaned up test column`);
    
  } catch (error) {
    console.log(`   ❌ Error during column addition test:`, error.message);
  }
}

// Main test function
async function testColumnChangesSync() {
  try {
    await connectDatabases();
    
    const { columns, records } = await getCurrentState();
    
    if (columns.length === 0) {
      console.log('\n❌ No columns found in table');
      return;
    }
    
    // Run all tests
    await testColumnRename(columns, records);
    await testColumnDataTypeChange(columns, records);
    await testColumnAddition(columns, records);
    await testColumnDeletion(columns, records);
    
    console.log('\n🎉 Column Changes Sync Test Summary:');
    console.log('   📝 Check the results above to see if records sync with column changes');
    console.log('   💡 If records are NOT synced, you may need to implement column change handlers');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await mongoose.connection.close();
    await sequelize.close();
    console.log('\n📡 Database connections closed');
  }
}

// Run the tests
testColumnChangesSync();



