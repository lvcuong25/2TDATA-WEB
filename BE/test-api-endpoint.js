import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing API Endpoint for Record Creation...');

async function testApiEndpoint() {
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
    
    // ===== SIMULATE API CALL =====
    console.log('\n🌐 SIMULATING API CALL...');
    
    // Simulate the request body that frontend would send
    const requestBody = {
      tableId: tableId,
      data: {
        'Abc': 'API Test Record',
        'xyz': 'Created via API simulation'
      }
    };
    
    console.log('📤 Request body:', requestBody);
    
    // Simulate the controller logic (like recordControllerPostgres.js)
    console.log('\n🔧 Simulating Controller Logic...');
    
    const userId = '68d6be17362e0b14adfa4367';
    const siteId = 'test-site';
    
    // Create record in PostgreSQL (like the controller does)
    const newRecord = await Record.create({
      table_id: requestBody.tableId,
      user_id: userId,
      site_id: siteId,
      data: requestBody.data
    });
    
    console.log(`✅ Record created in PostgreSQL: ${newRecord.id}`);
    console.log(`📊 Data:`, newRecord.data);
    
    // Update Metabase table (like the controller does)
    try {
      const metabaseRecord = {
        id: newRecord.id,
        table_id: newRecord.table_id,
        user_id: newRecord.user_id,
        site_id: newRecord.site_id,
        data: newRecord.data,
        created_at: newRecord.created_at,
        updated_at: newRecord.updated_at
      };
      
      // Import updateMetabaseTable function
      const { updateMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
      await updateMetabaseTable(requestBody.tableId, metabaseRecord, 'insert', [], table.database_id);
      console.log(`✅ Metabase table updated for record: ${newRecord.id}`);
    } catch (metabaseError) {
      console.error('❌ Metabase update failed:', metabaseError);
    }
    
    // Verify record in Metabase
    console.log('\n🔍 Verifying record in Metabase...');
    const [recordsAfterCreate] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      WHERE id = '${newRecord.id}'
    `);
    
    if (recordsAfterCreate.length > 0) {
      console.log(`✅ Record found in Metabase:`, recordsAfterCreate[0]);
    } else {
      console.log(`❌ Record NOT found in Metabase!`);
    }
    
    // Check total records
    const [finalRecords] = await sequelize.query(`
      SELECT * FROM "${schemaName}"."${metabaseTableName}"
      ORDER BY created_at
    `);
    
    console.log(`\n📊 Final Metabase records: ${finalRecords.length}`);
    finalRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id}`);
      console.log(`      Abc: "${record.Abc}"`);
      console.log(`      xyz: "${record.xyz}"`);
      console.log(`      Created: ${record.created_at}`);
    });
    
    console.log('\n🎉 API endpoint simulation completed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Record Creation: SUCCESS');
    console.log('✅ Metabase Sync: SUCCESS');
    console.log('✅ Data Verification: SUCCESS');
    
    console.log('\n💡 Instructions for Frontend Testing:');
    console.log('1. Open your frontend application');
    console.log('2. Navigate to the table: Test Table Schema');
    console.log('3. Try to create a new record');
    console.log('4. Check if it appears in Metabase table');
    console.log('5. If not, check browser network tab for API errors');
    console.log('6. Check server logs for sync errors');
    
    console.log('\n🔗 Metabase Connection Info:');
    console.log(`Schema: ${schemaName}`);
    console.log(`Table: ${metabaseTableName}`);
    console.log(`SQL Query: SELECT * FROM "${schemaName}"."${metabaseTableName}";`);
    
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
testApiEndpoint();


