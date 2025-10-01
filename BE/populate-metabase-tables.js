import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { createMetabaseTable, updateMetabaseTable } from './src/utils/metabaseTableCreator.js';
import dotenv from 'dotenv';

dotenv.config();

// Set environment variables for PostgreSQL
process.env.PG_DATABASE = process.env.POSTGRES_DB;
process.env.PG_USER = process.env.POSTGRES_USER;
process.env.PG_PASSWORD = process.env.POSTGRES_PASSWORD;
process.env.PG_HOST = process.env.POSTGRES_HOST;
process.env.PG_PORT = process.env.POSTGRES_PORT;

// Connect to databases
const connectDatabases = async () => {
  try {
    // MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ Connected to MongoDB');
    
    // PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

// Populate Metabase tables with existing data
const populateMetabaseTables = async () => {
  try {
    console.log('🚀 Populating Metabase tables with existing data...\n');
    
    // Get all PostgreSQL tables
    const postgresTables = await Table.findAll();
    console.log(`📋 Found ${postgresTables.length} PostgreSQL tables`);
    
    for (const table of postgresTables) {
      console.log(`\n🔄 Processing table: ${table.name} (${table.id})`);
      
      // Get columns and records for this table
      const [columns, records] = await Promise.all([
        Column.findAll({ where: { table_id: table.id } }),
        Record.findAll({ where: { table_id: table.id } })
      ]);
      
      console.log(`   - Columns: ${columns.length}`);
      console.log(`   - Records: ${records.length}`);
      
      if (records.length === 0) {
        console.log('   ⚠️ No records found, skipping...');
        continue;
      }
      
      // Check if Metabase table already exists
      const expectedMetabaseTableName = `metabase_${table.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${table.id.slice(-8)}`;
      const [existingTables] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${expectedMetabaseTableName}'
      `);
      
      if (existingTables.length > 0) {
        console.log(`   ✅ Metabase table exists: ${expectedMetabaseTableName}`);
        
        // Check if it has data
        const [rowCount] = await sequelize.query(`SELECT COUNT(*) as count FROM "${expectedMetabaseTableName}"`);
        const currentRowCount = rowCount[0].count;
        
        console.log(`   - Current rows in Metabase table: ${currentRowCount}`);
        
        if (currentRowCount === 0) {
          console.log('   🔄 Populating empty Metabase table...');
          
          // Recreate the Metabase table with current data
          const metabaseResult = await createMetabaseTable(
            table.id,
            table.name,
            'existing-data-sync'
          );
          
          if (metabaseResult.success) {
            console.log(`   ✅ Successfully populated: ${metabaseResult.recordCount} records`);
          } else {
            console.log(`   ❌ Failed to populate: ${metabaseResult.error}`);
          }
        } else {
          console.log('   ✅ Metabase table already has data');
        }
      } else {
        console.log(`   🔄 Creating new Metabase table: ${expectedMetabaseTableName}`);
        
        // Create new Metabase table
        const metabaseResult = await createMetabaseTable(
          table.id,
          table.name,
          'new-table-sync'
        );
        
        if (metabaseResult.success) {
          console.log(`   ✅ Successfully created and populated: ${metabaseResult.recordCount} records`);
        } else {
          console.log(`   ❌ Failed to create: ${metabaseResult.error}`);
        }
      }
    }
    
    console.log('\n🎉 Metabase table population completed!');
    
    // Verify results
    console.log('\n📊 Verification:');
    const [allMetabaseTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'metabase_%'
      ORDER BY table_name
    `);
    
    for (const metabaseTable of allMetabaseTables) {
      const [rowCount] = await sequelize.query(`SELECT COUNT(*) as count FROM "${metabaseTable.table_name}"`);
      console.log(`   ${metabaseTable.table_name}: ${rowCount[0].count} rows`);
    }
    
  } catch (error) {
    console.error('❌ Population failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
};

// Test real-time updates
const testRealTimeUpdates = async () => {
  try {
    console.log('\n🧪 Testing real-time updates...');
    
    // Find a table with data
    const postgresTables = await Table.findAll();
    const tableWithData = postgresTables.find(async (table) => {
      const records = await Record.findAll({ where: { table_id: table.id } });
      return records.length > 0;
    });
    
    if (!tableWithData) {
      console.log('   ⚠️ No tables with data found for testing');
      return;
    }
    
    const records = await Record.findAll({ where: { table_id: tableWithData.id } });
    if (records.length === 0) {
      console.log('   ⚠️ No records found for testing');
      return;
    }
    
    const testRecord = records[0];
    console.log(`   Testing with table: ${tableWithData.name}`);
    console.log(`   Testing with record: ${testRecord.id}`);
    
    // Test updateMetabaseTable
    const updateResult = await updateMetabaseTable(
      tableWithData.id,
      {
        id: testRecord.id,
        table_id: testRecord.table_id,
        user_id: testRecord.user_id,
        site_id: testRecord.site_id,
        data: testRecord.data,
        created_at: testRecord.created_at,
        updated_at: testRecord.updated_at
      },
      'insert'
    );
    
    if (updateResult.success) {
      console.log('   ✅ Real-time update test successful');
    } else {
      console.log('   ❌ Real-time update test failed:', updateResult.error);
    }
    
  } catch (error) {
    console.error('❌ Real-time update test failed:', error);
  }
};

// Main function
const runPopulation = async () => {
  try {
    await connectDatabases();
    await populateMetabaseTables();
    await testRealTimeUpdates();
    console.log('\n🎉 All operations completed successfully!');
  } catch (error) {
    console.error('💥 Operation failed:', error);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
    process.exit(0);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPopulation();
}

export { populateMetabaseTables, testRealTimeUpdates, runPopulation };
