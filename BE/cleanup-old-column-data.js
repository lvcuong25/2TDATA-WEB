/**
 * Clean up old column data from records
 */

import mongoose from 'mongoose';
import { sequelize, Record as PostgresRecord } from './src/models/postgres/index.js';

const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
const oldColumnName = 'Renamed Abc Column';

console.log('🧹 Cleaning up old column data...');

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

// Clean up old column data
async function cleanupOldColumnData() {
  console.log(`\n📝 CLEANUP: Removing "${oldColumnName}" from all records...`);
  
  try {
    // Get all records with old column data
    const records = await PostgresRecord.findAll({
      where: { table_id: tableId }
    });
    
    let cleanedCount = 0;
    
    for (const record of records) {
      if (record.data && record.data[oldColumnName] !== undefined) {
        console.log(`   🧹 Cleaning record ${record.id}...`);
        console.log(`      Before:`, JSON.stringify(record.data, null, 6));
        
        // Remove the old column from data
        const cleanedData = { ...record.data };
        delete cleanedData[oldColumnName];
        
        // Update the record
        await record.update({
          data: cleanedData,
          updated_at: new Date()
        });
        
        console.log(`      After:`, JSON.stringify(cleanedData, null, 6));
        cleanedCount++;
      }
    }
    
    console.log(`\n   ✅ Cleaned up ${cleanedCount} records`);
    return cleanedCount;
    
  } catch (error) {
    console.log(`   ❌ Error during cleanup:`, error.message);
    return 0;
  }
}

// Verify cleanup
async function verifyCleanup() {
  console.log(`\n📝 VERIFY: Checking if cleanup was successful...`);
  
  try {
    const records = await PostgresRecord.findAll({
      where: { table_id: tableId }
    });
    
    const recordsWithOldData = records.filter(record => 
      record.data && record.data[oldColumnName] !== undefined
    );
    
    if (recordsWithOldData.length === 0) {
      console.log(`   ✅ Cleanup successful! No records contain "${oldColumnName}"`);
    } else {
      console.log(`   ⚠️ ${recordsWithOldData.length} records still contain old data`);
      recordsWithOldData.forEach(record => {
        console.log(`      Record ${record.id}:`, JSON.stringify(record.data, null, 6));
      });
    }
    
  } catch (error) {
    console.log(`   ❌ Error verifying cleanup:`, error.message);
  }
}

// Main function
async function cleanupOldData() {
  try {
    await connectDatabases();
    
    const cleanedCount = await cleanupOldColumnData();
    await verifyCleanup();
    
    console.log('\n🎉 Cleanup Summary:');
    if (cleanedCount > 0) {
      console.log(`   ✅ Successfully cleaned ${cleanedCount} records`);
      console.log('   📝 Frontend should no longer send old column data');
      console.log('   💡 You may need to refresh the frontend to see changes');
    } else {
      console.log('   ℹ️ No records needed cleaning');
    }
    
  } catch (error) {
    console.error('❌ Cleanup execution failed:', error);
  } finally {
    await mongoose.connection.close();
    await sequelize.close();
    console.log('\n📡 Database connections closed');
  }
}

// Run the cleanup
cleanupOldData();


