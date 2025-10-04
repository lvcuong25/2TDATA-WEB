/**
 * Implement column change handlers to sync records
 */

import mongoose from 'mongoose';
import { sequelize, Record as PostgresRecord, Column as PostgresColumn } from './src/models/postgres/index.js';

console.log('🔧 Implementing Column Change Handlers...');

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

// Handler for column rename
export const handleColumnRename = async (tableId, oldName, newName) => {
  console.log(`🔄 Syncing records for column rename: "${oldName}" → "${newName}"`);
  
  try {
    const records = await PostgresRecord.findAll({
      where: { table_id: tableId }
    });
    
    let updatedCount = 0;
    
    for (const record of records) {
      if (record.data && record.data[oldName] !== undefined) {
        const newData = { ...record.data };
        newData[newName] = newData[oldName];
        delete newData[oldName];
        
        await record.update({
          data: newData,
          updated_at: new Date()
        });
        
        updatedCount++;
      }
    }
    
    console.log(`✅ Updated ${updatedCount} records for column rename`);
    return updatedCount;
    
  } catch (error) {
    console.error(`❌ Error syncing records for column rename:`, error.message);
    return 0;
  }
};

// Handler for column deletion
export const handleColumnDeletion = async (tableId, columnName) => {
  console.log(`🗑️ Syncing records for column deletion: "${columnName}"`);
  
  try {
    const records = await PostgresRecord.findAll({
      where: { table_id: tableId }
    });
    
    let updatedCount = 0;
    
    for (const record of records) {
      if (record.data && record.data[columnName] !== undefined) {
        const newData = { ...record.data };
        delete newData[columnName];
        
        await record.update({
          data: newData,
          updated_at: new Date()
        });
        
        updatedCount++;
      }
    }
    
    console.log(`✅ Updated ${updatedCount} records for column deletion`);
    return updatedCount;
    
  } catch (error) {
    console.error(`❌ Error syncing records for column deletion:`, error.message);
    return 0;
  }
};

// Handler for column data type change
export const handleColumnDataTypeChange = async (tableId, columnName, oldType, newType) => {
  console.log(`🔄 Syncing records for data type change: "${columnName}" (${oldType} → ${newType})`);
  
  try {
    const records = await PostgresRecord.findAll({
      where: { table_id: tableId }
    });
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const record of records) {
      if (record.data && record.data[columnName] !== undefined) {
        const value = record.data[columnName];
        let newValue = value;
        
        // Convert data based on new type
        if (newType === 'number' && value !== '' && value !== null) {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            console.log(`⚠️ Skipping record ${record.id} - invalid number: "${value}"`);
            skippedCount++;
            continue;
          }
          newValue = numValue;
        } else if (newType === 'checkbox') {
          newValue = Boolean(value);
        } else if (newType === 'text') {
          newValue = String(value);
        }
        
        const newData = { ...record.data };
        newData[columnName] = newValue;
        
        await record.update({
          data: newData,
          updated_at: new Date()
        });
        
        updatedCount++;
      }
    }
    
    console.log(`✅ Updated ${updatedCount} records, skipped ${skippedCount} records for data type change`);
    return { updated: updatedCount, skipped: skippedCount };
    
  } catch (error) {
    console.error(`❌ Error syncing records for data type change:`, error.message);
    return { updated: 0, skipped: 0 };
  }
};

// Test the handlers
async function testHandlers() {
  try {
    await connectDatabases();
    
    const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
    
    console.log('\n📝 Testing Column Change Handlers...');
    
    // Test column deletion handler
    console.log('\n1. Testing column deletion handler:');
    const deletedCount = await handleColumnDeletion(tableId, 'đasadas');
    
    // Test column rename handler (if we had a column to rename)
    console.log('\n2. Testing column rename handler:');
    // This would be called when a column is renamed
    
    // Test data type change handler
    console.log('\n3. Testing data type change handler:');
    // This would be called when a column data type is changed
    
    console.log('\n🎉 Handler testing completed');
    
  } catch (error) {
    console.error('❌ Handler testing failed:', error);
  } finally {
    await mongoose.connection.close();
    await sequelize.close();
    console.log('\n📡 Database connections closed');
  }
}

// Run the test
testHandlers();


