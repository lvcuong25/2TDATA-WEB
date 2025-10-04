import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { getDatabaseSchema } from './src/services/schemaManager.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔄 Force Re-sync All Records...');

async function forceResyncAllRecords() {
  try {
    console.log('📡 Connecting to databases...');
    
    // Connect to databases
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    const databaseId = '68de834d188faaa09c80b006';
    const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
    
    console.log(`\n🔍 Re-syncing Database: ${databaseId}`);
    console.log(`🔍 Re-syncing Table: ${tableId}`);
    
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
    
    // Get all records
    const records = await Record.findAll({
      where: { table_id: tableId },
      order: [['created_at', 'ASC']]
    });
    
    console.log(`\n📊 Found ${records.length} records to re-sync`);
    
    // Re-sync each record to Metabase
    const { updateMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
    
    let syncedCount = 0;
    let errorCount = 0;
    
    for (const record of records) {
      try {
        const metabaseRecord = {
          id: record.id,
          table_id: record.table_id,
          user_id: record.user_id,
          site_id: record.site_id,
          data: record.data,
          created_at: record.created_at,
          updated_at: record.updated_at
        };
        
        await updateMetabaseTable(record.table_id, metabaseRecord, 'update', [], databaseId);
        syncedCount++;
        console.log(`   ✅ Re-synced record: ${record.id}`);
      } catch (error) {
        errorCount++;
        console.log(`   ❌ Failed to re-sync record ${record.id}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Re-sync Summary:`);
    console.log(`   ✅ Successfully synced: ${syncedCount} records`);
    console.log(`   ❌ Failed to sync: ${errorCount} records`);
    
    // Check Metabase table after re-sync
    const [metabaseTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${schemaName}' 
      AND table_name LIKE 'metabase_%'
    `);
    
    if (metabaseTables.length > 0) {
      const metabaseTableName = metabaseTables[0].table_name;
      console.log(`\n📊 Metabase table: ${metabaseTableName}`);
      
      const [metabaseRecords] = await sequelize.query(`
        SELECT * FROM "${schemaName}"."${metabaseTableName}"
        ORDER BY created_at
      `);
      
      console.log(`📊 Metabase records after re-sync (${metabaseRecords.length}):`);
      metabaseRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}`);
        // Show all columns dynamically
        Object.keys(record).forEach(key => {
          if (!['id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at'].includes(key)) {
            console.log(`      ${key}: "${record[key] || '[null]'}" (type: ${typeof record[key]})`);
          }
        });
      });
    }
    
    console.log('\n🎉 Force re-sync completed!');
    
  } catch (error) {
    console.error('❌ Re-sync failed:', error.message);
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

// Run the re-sync
forceResyncAllRecords();


