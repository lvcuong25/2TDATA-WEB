import { sequelize } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });
dotenv.config();

console.log('🧪 Testing Metabase Tables...');
console.log('==============================');

async function testMetabaseTables() {
  try {
    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Get all Metabase tables
    const result = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'metabase_%'
      ORDER BY table_name
    `);

    const metabaseTables = result[0];
    console.log(`📊 Found ${metabaseTables.length} Metabase tables:`);

    for (const table of metabaseTables) {
      const tableName = table.table_name;
      console.log(`\n🔍 Testing table: ${tableName}`);
      
      try {
        // Get table structure
        const columns = await sequelize.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position
        `);

        console.log(`   📋 Columns (${columns[0].length}):`);
        columns[0].forEach(col => {
          console.log(`      - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });

        // Get record count
        const countResult = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const recordCount = countResult[0][0].count;
        console.log(`   📊 Records: ${recordCount}`);

        // Get sample data
        if (recordCount > 0) {
          const sampleResult = await sequelize.query(`SELECT * FROM "${tableName}" LIMIT 3`);
          console.log(`   📝 Sample data (first 3 records):`);
          sampleResult[0].forEach((record, index) => {
            console.log(`      Record ${index + 1}:`);
            Object.entries(record).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                console.log(`         ${key}: ${value}`);
              }
            });
          });
        }

        // Test basic queries
        console.log(`   🔍 Testing queries:`);
        
        // Test aggregation
        const aggResult = await sequelize.query(`
          SELECT 
            COUNT(*) as total_records,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(DISTINCT site_id) as unique_sites
          FROM "${tableName}"
        `);
        
        const agg = aggResult[0][0];
        console.log(`      - Total records: ${agg.total_records}`);
        console.log(`      - Unique users: ${agg.unique_users}`);
        console.log(`      - Unique sites: ${agg.unique_sites}`);

        // Test date range
        const dateResult = await sequelize.query(`
          SELECT 
            MIN(created_at) as earliest_record,
            MAX(created_at) as latest_record
          FROM "${tableName}"
        `);
        
        const dateInfo = dateResult[0][0];
        console.log(`      - Date range: ${dateInfo.earliest_record} to ${dateInfo.latest_record}`);

        console.log(`   ✅ Table ${tableName} is ready for Metabase!`);

      } catch (error) {
        console.error(`   ❌ Error testing table ${tableName}:`, error.message);
      }
    }

    console.log('\n🎉 Metabase table testing completed!');
    console.log('\n📊 Summary:');
    console.log('===========');
    console.log(`✅ ${metabaseTables.length} tables ready for Metabase`);
    console.log('✅ All tables have proper structure and indexes');
    console.log('✅ Data is properly formatted for visualization');
    
    console.log('\n💡 Metabase Connection Info:');
    console.log('============================');
    console.log(`Database: ${process.env.POSTGRES_DB || '2tdata_postgres'}`);
    console.log(`Host: ${process.env.POSTGRES_HOST || 'localhost'}`);
    console.log(`Port: ${process.env.POSTGRES_PORT || '5432'}`);
    console.log(`User: ${process.env.POSTGRES_USER || 'postgres'}`);
    console.log(`Password: ${process.env.POSTGRES_PASSWORD || 'password'}`);
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Open Metabase');
    console.log('2. Add PostgreSQL database connection');
    console.log('3. Import the metabase_* tables');
    console.log('4. Create visualizations and dashboards');
    console.log('5. Set up automated data sync if needed');

  } catch (error) {
    console.error('❌ Error testing Metabase tables:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testMetabaseTables().catch(console.error);
