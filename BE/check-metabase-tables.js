import { sequelize } from './src/models/postgres/index.js';

async function checkMetabaseTables() {
  try {
    console.log('🎯 Checking Metabase Tables in PostgreSQL...');
    console.log('=============================================');
    
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'metabase_%' 
      ORDER BY table_name
    `);
    
    console.log('📊 Found Metabase Tables:');
    results.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    console.log(`\n📊 Total: ${results.length} Metabase tables`);
    
    // Check if the new table was created
    const newTableExists = results.some(row => 
      row.table_name.includes('auto_metabase_test') || 
      row.table_name.includes('a83c73c7')
    );
    
    if (newTableExists) {
      console.log('✅ New Metabase table was created automatically!');
    } else {
      console.log('❌ New Metabase table was NOT created automatically');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMetabaseTables();

