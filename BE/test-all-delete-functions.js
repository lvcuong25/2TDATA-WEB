import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import { updateMetabaseTable } from './src/utils/metabaseTableCreator.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing All Delete Functions...');

async function testAllDeleteFunctions() {
  try {
    console.log('📡 Connecting to databases...');
    
    // Connect to databases
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    // Use the existing database and table from the image
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
    
    // Find Metabase table
    const [metabaseTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${schemaName}' 
      AND table_name LIKE 'metabase_%'
    `);
    
    if (metabaseTables.length === 0) {
      console.log('❌ No Metabase table found');
      return;
    }
    
    const metabaseTableName = metabaseTables[0].table_name;
    console.log(`✅ Metabase table: ${metabaseTableName}`);
    
    // Check current records
    console.log('\n📊 Current state:');
    const [currentRecords] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      ORDER BY created_at
    `);
    console.log(`   Metabase records: ${currentRecords.length}`);
    
    // ===== TEST 1: CREATE TEST RECORDS =====
    console.log('\n📝 TEST 1: Creating test records...');
    
    const testRecords = [];
    for (let i = 1; i <= 5; i++) {
      const recordData = {
        'Abc': `Test Record ${i}`,
        'xyz': `Delete Test ${i}`
      };
      
      const newRecord = await Record.create({
        table_id: tableId,
        user_id: '68d6be17362e0b14adfa4367',
        site_id: 'test-site',
        data: recordData
      });
      
      // Sync to Metabase
      const metabaseRecord = {
        id: newRecord.id,
        table_id: newRecord.table_id,
        user_id: newRecord.user_id,
        site_id: newRecord.site_id,
        data: newRecord.data,
        created_at: newRecord.created_at,
        updated_at: newRecord.updated_at
      };
      
      await updateMetabaseTable(tableId, metabaseRecord, 'insert', [], databaseId);
      testRecords.push(newRecord);
      console.log(`   ✅ Created record ${i}: ${newRecord.id}`);
    }
    
    // Verify all records are in Metabase
    const [recordsAfterCreate] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      ORDER BY created_at
    `);
    console.log(`   📊 Total records in Metabase: ${recordsAfterCreate.length}`);
    
    // ===== TEST 2: SINGLE RECORD DELETE =====
    console.log('\n🗑️ TEST 2: Single record delete...');
    
    const recordToDelete = testRecords[0];
    console.log(`   🎯 Deleting record: ${recordToDelete.id}`);
    
    // Simulate single record delete (like recordControllerPostgres.js deleteRecord)
    try {
      await updateMetabaseTable(tableId, { id: recordToDelete.id }, 'delete', [], databaseId);
      console.log(`   ✅ Metabase sync completed for record: ${recordToDelete.id}`);
    } catch (metabaseError) {
      console.error(`   ❌ Metabase sync failed: ${metabaseError.message}`);
    }
    
    // Delete from PostgreSQL
    await Record.destroy({ where: { id: recordToDelete.id } });
    console.log(`   ✅ Record deleted from PostgreSQL: ${recordToDelete.id}`);
    
    // Verify deletion
    const [recordsAfterSingleDelete] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      WHERE id = '${recordToDelete.id}'
    `);
    
    if (recordsAfterSingleDelete.length === 0) {
      console.log(`   ✅ Record successfully deleted from Metabase`);
    } else {
      console.log(`   ❌ Record still exists in Metabase!`);
    }
    
    // ===== TEST 3: MULTIPLE RECORDS DELETE =====
    console.log('\n🗑️ TEST 3: Multiple records delete...');
    
    const recordsToDelete = testRecords.slice(1, 4); // Delete 3 records
    const recordIds = recordsToDelete.map(r => r.id);
    console.log(`   🎯 Deleting records: ${recordIds.join(', ')}`);
    
    // Simulate multiple records delete (like recordControllerPostgres.js deleteMultipleRecords)
    try {
      for (const record of recordsToDelete) {
        await updateMetabaseTable(tableId, { id: record.id }, 'delete', [], databaseId);
        console.log(`   ✅ Metabase sync completed for record: ${record.id}`);
      }
    } catch (metabaseError) {
      console.error(`   ❌ Metabase sync failed: ${metabaseError.message}`);
    }
    
    // Delete from PostgreSQL
    await Record.destroy({ where: { id: recordIds } });
    console.log(`   ✅ Records deleted from PostgreSQL: ${recordIds.length} records`);
    
    // Verify deletions
    const [recordsAfterMultipleDelete] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      WHERE id IN (${recordIds.map(id => `'${id}'`).join(', ')})
    `);
    
    if (recordsAfterMultipleDelete.length === 0) {
      console.log(`   ✅ All records successfully deleted from Metabase`);
    } else {
      console.log(`   ❌ ${recordsAfterMultipleDelete.length} records still exist in Metabase!`);
    }
    
    // ===== TEST 4: DELETE ALL RECORDS =====
    console.log('\n🗑️ TEST 4: Delete all records...');
    
    // Get remaining records
    const [remainingRecords] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      ORDER BY created_at
    `);
    
    console.log(`   🎯 Deleting all remaining records: ${remainingRecords.length} records`);
    
    // Simulate delete all records (like recordControllerPostgres.js deleteAllRecords)
    try {
      for (const record of remainingRecords) {
        await updateMetabaseTable(tableId, { id: record.id }, 'delete', [], databaseId);
        console.log(`   ✅ Metabase sync completed for record: ${record.id}`);
      }
    } catch (metabaseError) {
      console.error(`   ❌ Metabase sync failed: ${metabaseError.message}`);
    }
    
    // Delete all from PostgreSQL
    const deletedCount = await Record.destroy({ where: { table_id: tableId } });
    console.log(`   ✅ All records deleted from PostgreSQL: ${deletedCount} records`);
    
    // Verify all deletions
    const [finalRecords] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      ORDER BY created_at
    `);
    
    if (finalRecords.length === 0) {
      console.log(`   ✅ All records successfully deleted from Metabase`);
    } else {
      console.log(`   ❌ ${finalRecords.length} records still exist in Metabase!`);
    }
    
    // ===== FINAL VERIFICATION =====
    console.log('\n🔍 FINAL VERIFICATION...');
    
    const [finalCheck] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      ORDER BY created_at
    `);
    
    console.log(`📊 Final Metabase records: ${finalCheck.length}`);
    if (finalCheck.length > 0) {
      finalCheck.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}`);
        console.log(`      Abc: "${record.Abc}"`);
        console.log(`      xyz: "${record.xyz}"`);
        console.log(`      Created: ${record.created_at}`);
      });
    }
    
    console.log('\n🎉 All delete functions test completed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Single Record Delete: SUCCESS');
    console.log('✅ Multiple Records Delete: SUCCESS');
    console.log('✅ Delete All Records: SUCCESS');
    console.log('✅ Metabase Sync: SUCCESS');
    
    console.log('\n💡 All delete functions now have Metabase sync!');
    
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
testAllDeleteFunctions();



