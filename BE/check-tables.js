import { sequelize } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });
dotenv.config();

async function checkTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('\n📊 Tables in PostgreSQL:');
    console.log('========================');
    
    if (results.length === 0) {
      console.log('❌ No tables found in PostgreSQL');
    } else {
      results.forEach((table, index) => {
        console.log(`${index + 1}. ${table.table_name}`);
      });
    }

    // Check if we have the main tables
    const mainTables = ['tables', 'columns', 'records', 'rows'];
    const metabaseTables = results.filter(t => t.table_name.startsWith('metabase_'));
    
    console.log('\n📋 Summary:');
    console.log(`   • Main tables: ${mainTables.length}`);
    console.log(`   • Metabase tables: ${metabaseTables.length}`);
    console.log(`   • Total tables: ${results.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTables();
