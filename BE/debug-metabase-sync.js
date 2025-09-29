import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { createMetabaseTable, updateMetabaseTable } from './src/utils/metabaseTableCreator.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Connect to PostgreSQL
const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error);
    throw error;
  }
};

// Debug Metabase sync
const debugMetabaseSync = async () => {
  try {
    console.log('🔍 Debugging Metabase synchronization...\n');
    
    // Step 1: Check existing tables in PostgreSQL
    console.log('📋 Step 1: Checking PostgreSQL tables...');
    const postgresTables = await Table.findAll();
    console.log(`   Found ${postgresTables.length} tables in PostgreSQL:`);
    postgresTables.forEach(table => {
      console.log(`   - ${table.name} (${table.id})`);
    });
    
    // Step 2: Check existing Metabase tables
    console.log('\n📋 Step 2: Checking existing Metabase tables...');
    const [metabaseTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'metabase_%'
      ORDER BY table_name
    `);
    
    console.log(`   Found ${metabaseTables.length} Metabase tables:`);
    metabaseTables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // Step 3: Check data in PostgreSQL tables
    console.log('\n📋 Step 3: Checking data in PostgreSQL tables...');
    for (const table of postgresTables) {
      const columns = await Column.findAll({ where: { table_id: table.id } });
      const records = await Record.findAll({ where: { table_id: table.id } });
      
      console.log(`   Table: ${table.name} (${table.id})`);
      console.log(`     - Columns: ${columns.length}`);
      console.log(`     - Records: ${records.length}`);
      
      if (records.length > 0) {
        console.log(`     - Sample record data:`, records[0].data);
      }
    }
    
    // Step 4: Check data in Metabase tables
    console.log('\n📋 Step 4: Checking data in Metabase tables...');
    for (const metabaseTable of metabaseTables) {
      const [rows] = await sequelize.query(`SELECT COUNT(*) as count FROM "${metabaseTable.table_name}"`);
      console.log(`   ${metabaseTable.table_name}: ${rows[0].count} rows`);
      
      if (rows[0].count > 0) {
        const [sampleData] = await sequelize.query(`SELECT * FROM "${metabaseTable.table_name}" LIMIT 1`);
        console.log(`     - Sample data:`, sampleData[0]);
      }
    }
    
    // Step 5: Test Metabase table creation for existing data
    console.log('\n📋 Step 5: Testing Metabase table creation for existing data...');
    const testTable = postgresTables.find(t => t.name.toLowerCase().includes('postgres'));
    
    if (testTable) {
      console.log(`   Testing with table: ${testTable.name} (${testTable.id})`);
      
      try {
        const metabaseResult = await createMetabaseTable(
          testTable.id,
          testTable.name,
          'test-org-id'
        );
        
        if (metabaseResult.success) {
          console.log('   ✅ Metabase table creation successful:');
          console.log(`     - Table name: ${metabaseResult.metabaseTableName}`);
          console.log(`     - Data fields: ${metabaseResult.dataFields.join(', ')}`);
          console.log(`     - Record count: ${metabaseResult.recordCount}`);
          console.log(`     - Column count: ${metabaseResult.columnCount}`);
        } else {
          console.log('   ❌ Metabase table creation failed:', metabaseResult.error);
        }
      } catch (error) {
        console.log('   ❌ Metabase table creation error:', error.message);
      }
    } else {
      console.log('   ⚠️ No suitable test table found');
    }
    
    // Step 6: Test real-time update
    console.log('\n📋 Step 6: Testing real-time update...');
    if (testTable) {
      const records = await Record.findAll({ where: { table_id: testTable.id } });
      
      if (records.length > 0) {
        const testRecord = records[0];
        console.log(`   Testing update for record: ${testRecord.id}`);
        
        try {
          const updateResult = await updateMetabaseTable(
            testTable.id,
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
            console.log('   ✅ Real-time update successful');
          } else {
            console.log('   ❌ Real-time update failed:', updateResult.error);
          }
        } catch (error) {
          console.log('   ❌ Real-time update error:', error.message);
        }
      } else {
        console.log('   ⚠️ No records found for testing');
      }
    }
    
    console.log('\n🎯 Debug summary:');
    console.log(`   - PostgreSQL tables: ${postgresTables.length}`);
    console.log(`   - Metabase tables: ${metabaseTables.length}`);
    console.log(`   - Total PostgreSQL records: ${postgresTables.reduce(async (sum, table) => {
      const records = await Record.findAll({ where: { table_id: table.id } });
      return sum + records.length;
    }, 0)}`);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
};

// Main function
const runDebug = async () => {
  try {
    await connectMongoDB();
    await connectPostgreSQL();
    await debugMetabaseSync();
    console.log('\n🎉 Debug completed!');
  } catch (error) {
    console.error('💥 Debug failed:', error);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
    process.exit(0);
  }
};

// Run debug if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDebug();
}

export { debugMetabaseSync, runDebug };
