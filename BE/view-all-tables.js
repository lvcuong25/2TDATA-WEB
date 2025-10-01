import { sequelize } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });
dotenv.config();

async function viewAllTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('\n📊 DETAILED VIEW OF ALL TABLES:');
    console.log('================================');

    for (const table of results) {
      const tableName = table.table_name;
      console.log(`\n🗂️  Table: ${tableName}`);
      console.log('─'.repeat(50));

      // Get column info
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position
      `);

      console.log('📋 Columns:');
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`   • ${col.column_name}: ${col.data_type} (${nullable})`);
      });

      // Get record count
      const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      console.log(`📊 Records: ${countResult[0].count}`);

      // Show sample data if any
      if (countResult[0].count > 0) {
        const [sampleData] = await sequelize.query(`SELECT * FROM "${tableName}" LIMIT 3`);
        console.log('📝 Sample Data:');
        sampleData.forEach((record, index) => {
          console.log(`   Record ${index + 1}:`);
          for (const key in record) {
            if (record[key] !== null && record[key] !== undefined) {
              console.log(`      ${key}: ${JSON.stringify(record[key])}`);
            }
          }
        });
      }
    }

    console.log('\n🎉 All tables viewed successfully!');
    console.log('\n💡 To view these tables in pgAdmin 4:');
    console.log('   1. Open pgAdmin 4');
    console.log('   2. Connect to PostgreSQL server');
    console.log('   3. Select database "2tdata_postgres"');
    console.log('   4. Expand: Schemas → public → Tables');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

viewAllTables();
