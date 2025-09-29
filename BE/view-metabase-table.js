import { sequelize } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });
dotenv.config();

console.log('🔍 Viewing Metabase Table Details...');
console.log('====================================');

async function viewMetabaseTable() {
  try {
    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Get all Metabase tables
    const tablesResult = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'metabase_%'
      ORDER BY table_name
    `);

    const metabaseTables = tablesResult[0];
    console.log(`📊 Found ${metabaseTables.length} Metabase tables:`);
    metabaseTables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });

    // Let's examine the table with most data: metabase_test_cell_b25cc75c
    const tableName = 'metabase_test_cell_b25cc75c';
    console.log(`\n🎯 Examining table: ${tableName}`);
    console.log('='.repeat(60));

    // Get table structure
    const columnsResult = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = '${tableName}'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 TABLE STRUCTURE:');
    console.log('─'.repeat(40));
    columnsResult[0].forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`   • ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
    });

    // Get all records
    const recordsResult = await sequelize.query(`SELECT * FROM "${tableName}" ORDER BY created_at`);
    const records = recordsResult[0];

    console.log(`\n📊 ALL RECORDS (${records.length} total):`);
    console.log('─'.repeat(40));

    records.forEach((record, index) => {
      console.log(`\n📝 Record ${index + 1}:`);
      console.log(`   ID: ${record.id}`);
      console.log(`   Table ID: ${record.table_id}`);
      console.log(`   User ID: ${record.user_id}`);
      console.log(`   Site ID: ${record.site_id}`);
      console.log(`   Created: ${record.created_at}`);
      console.log(`   Updated: ${record.updated_at}`);
      
      // Show data columns
      const dataColumns = Object.keys(record).filter(key => 
        !['id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at'].includes(key)
      );
      
      if (dataColumns.length > 0) {
        console.log(`   Data Columns:`);
        dataColumns.forEach(col => {
          const value = record[col];
          if (value !== null && value !== undefined) {
            console.log(`      ${col}: "${value}"`);
          } else {
            console.log(`      ${col}: NULL`);
          }
        });
      }
    });

    // Show some analytics
    console.log(`\n📈 ANALYTICS:`);
    console.log('─'.repeat(40));

    // Count by user
    const userStats = await sequelize.query(`
      SELECT 
        user_id,
        COUNT(*) as record_count,
        MIN(created_at) as first_record,
        MAX(created_at) as last_record
      FROM "${tableName}"
      GROUP BY user_id
      ORDER BY record_count DESC
    `);

    console.log(`\n👥 Records by User:`);
    userStats[0].forEach(stat => {
      console.log(`   User ${stat.user_id}: ${stat.record_count} records`);
      console.log(`      First: ${stat.first_record}`);
      console.log(`      Last: ${stat.last_record}`);
    });

    // Count non-null values for each data column
    const dataColumns = columnsResult[0]
      .filter(col => !['id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at'].includes(col.column_name))
      .map(col => col.column_name);

    if (dataColumns.length > 0) {
      console.log(`\n📊 Data Column Statistics:`);
      for (const col of dataColumns) {
        const colStats = await sequelize.query(`
          SELECT 
            COUNT(*) as total,
            COUNT("${col}") as non_null,
            COUNT(*) - COUNT("${col}") as null_count
          FROM "${tableName}"
        `);
        
        const stats = colStats[0][0];
        console.log(`   ${col}:`);
        console.log(`      Total: ${stats.total}, Non-null: ${stats.non_null}, Null: ${stats.null_count}`);
        
        // Show unique values if not too many
        if (stats.non_null > 0 && stats.non_null <= 10) {
          const uniqueValues = await sequelize.query(`
            SELECT DISTINCT "${col}" as value
            FROM "${tableName}"
            WHERE "${col}" IS NOT NULL
            ORDER BY "${col}"
          `);
          console.log(`      Values: ${uniqueValues[0].map(v => `"${v.value}"`).join(', ')}`);
        }
      }
    }

    // Show time range
    const timeStats = await sequelize.query(`
      SELECT 
        MIN(created_at) as earliest,
        MAX(created_at) as latest,
        MAX(created_at) - MIN(created_at) as duration
      FROM "${tableName}"
    `);
    
    const timeInfo = timeStats[0][0];
    console.log(`\n⏰ Time Range:`);
    console.log(`   Earliest: ${timeInfo.earliest}`);
    console.log(`   Latest: ${timeInfo.latest}`);
    console.log(`   Duration: ${timeInfo.duration}`);

    // Show sample queries that would work well in Metabase
    console.log(`\n🔍 SAMPLE METABASE QUERIES:`);
    console.log('─'.repeat(40));
    console.log(`1. Total Records:`);
    console.log(`   SELECT COUNT(*) FROM "${tableName}";`);
    
    console.log(`\n2. Records by User:`);
    console.log(`   SELECT user_id, COUNT(*) as count FROM "${tableName}" GROUP BY user_id;`);
    
    console.log(`\n3. Records over Time:`);
    console.log(`   SELECT DATE(created_at) as date, COUNT(*) as count FROM "${tableName}" GROUP BY DATE(created_at) ORDER BY date;`);
    
    if (dataColumns.length > 0) {
      console.log(`\n4. Data Column Analysis:`);
      dataColumns.forEach(col => {
        console.log(`   SELECT "${col}", COUNT(*) FROM "${tableName}" WHERE "${col}" IS NOT NULL GROUP BY "${col}";`);
      });
    }

    console.log(`\n🎉 Table analysis completed!`);
    console.log(`\n💡 This table is ready for Metabase visualization with:`);
    console.log(`   • ${records.length} records for analysis`);
    console.log(`   • ${dataColumns.length} data columns for charts`);
    console.log(`   • Time series data for trends`);
    console.log(`   • User-based grouping for segmentation`);

  } catch (error) {
    console.error('❌ Error viewing Metabase table:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

viewMetabaseTable().catch(console.error);
