import { sequelize } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });
dotenv.config();

console.log('🔍 Analyzing PostgreSQL Database Structure...');
console.log('==============================================');

async function analyzePostgreSQLStructure() {
  try {
    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Get all tables
    const tablesResult = await sequelize.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = tablesResult[0];
    console.log(`\n📊 Found ${tables.length} tables in PostgreSQL:`);
    console.log('==========================================');

    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`\n🗂️  Table: ${tableName}`);
      console.log('─'.repeat(50));

      // Get table columns
      const columnsResult = await sequelize.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position
      `);

      const columns = columnsResult[0];
      console.log(`📋 Columns (${columns.length}):`);
      
      columns.forEach(col => {
        let typeInfo = col.data_type;
        if (col.character_maximum_length) {
          typeInfo += `(${col.character_maximum_length})`;
        } else if (col.numeric_precision) {
          typeInfo += `(${col.numeric_precision}`;
          if (col.numeric_scale) {
            typeInfo += `,${col.numeric_scale}`;
          }
          typeInfo += ')';
        }
        
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        
        console.log(`   • ${col.column_name}: ${typeInfo} ${nullable}${defaultVal}`);
      });

      // Get indexes
      const indexesResult = await sequelize.query(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = '${tableName}'
        ORDER BY indexname
      `);

      const indexes = indexesResult[0];
      if (indexes.length > 0) {
        console.log(`\n🔗 Indexes (${indexes.length}):`);
        indexes.forEach(idx => {
          console.log(`   • ${idx.indexname}`);
        });
      }

      // Get foreign keys
      const fkResult = await sequelize.query(`
        SELECT 
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = '${tableName}'
      `);

      const foreignKeys = fkResult[0];
      if (foreignKeys.length > 0) {
        console.log(`\n🔗 Foreign Keys (${foreignKeys.length}):`);
        foreignKeys.forEach(fk => {
          console.log(`   • ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }

      // Get record count
      const countResult = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      const recordCount = countResult[0][0].count;
      console.log(`\n📊 Records: ${recordCount}`);

      // Get sample data for tables with records
      if (recordCount > 0 && recordCount <= 1000) {
        const sampleResult = await sequelize.query(`SELECT * FROM "${tableName}" LIMIT 2`);
        if (sampleResult[0].length > 0) {
          console.log(`\n📝 Sample Data (first 2 records):`);
          sampleResult[0].forEach((record, index) => {
            console.log(`   Record ${index + 1}:`);
            Object.entries(record).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                let displayValue = value;
                if (typeof value === 'object') {
                  displayValue = JSON.stringify(value).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '');
                } else if (typeof value === 'string' && value.length > 50) {
                  displayValue = value.substring(0, 50) + '...';
                }
                console.log(`      ${key}: ${displayValue}`);
              }
            });
          });
        }
      }
    }

    // Summary by table type
    console.log('\n\n📊 SUMMARY BY TABLE TYPE:');
    console.log('==========================');

    // Original migration tables
    const originalTables = tables.filter(t => !t.table_name.startsWith('metabase_'));
    console.log(`\n🗄️  Original Migration Tables (${originalTables.length}):`);
    originalTables.forEach(table => {
      console.log(`   • ${table.table_name}`);
    });

    // Metabase optimized tables
    const metabaseTables = tables.filter(t => t.table_name.startsWith('metabase_'));
    console.log(`\n🎯 Metabase Optimized Tables (${metabaseTables.length}):`);
    metabaseTables.forEach(table => {
      console.log(`   • ${table.table_name}`);
    });

    // Data distribution
    console.log(`\n📈 DATA DISTRIBUTION:`);
    for (const table of tables) {
      const countResult = await sequelize.query(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
      const count = countResult[0][0].count;
      console.log(`   • ${table.table_name}: ${count} records`);
    }

    // Database size
    const sizeResult = await sequelize.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size
    `);
    console.log(`\n💾 Database Size: ${sizeResult[0][0].database_size}`);

    console.log('\n🎉 PostgreSQL structure analysis completed!');

  } catch (error) {
    console.error('❌ Error analyzing PostgreSQL structure:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

analyzePostgreSQLStructure().catch(console.error);
