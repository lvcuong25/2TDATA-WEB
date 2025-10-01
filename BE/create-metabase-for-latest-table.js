import { sequelize } from './src/models/postgres/index.js';
import { createMetabaseTable } from './src/utils/metabaseTableCreator.js';

async function createMetabaseForLatestTable() {
  try {
    console.log('🎯 Creating Metabase table for latest table...');
    
    // Get the latest table
    const [results] = await sequelize.query(`
      SELECT * FROM tables 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (results.length === 0) {
      console.log('❌ No tables found');
      return;
    }
    
    const latestTable = results[0];
    console.log('📋 Latest table:', latestTable);
    
    // Get columns for this table
    const [columns] = await sequelize.query(`
      SELECT * FROM columns 
      WHERE table_id = '${latestTable.id}'
      ORDER BY "order" ASC
    `);
    
    console.log('📋 Columns:', columns);
    
    // Get records for this table
    const [records] = await sequelize.query(`
      SELECT * FROM records 
      WHERE table_id = '${latestTable.id}'
      ORDER BY created_at ASC
    `);
    
    console.log('📋 Records:', records.length);
    
    // Create Metabase table
    const result = await createMetabaseTable(latestTable, columns, records);
    
    console.log('🎯 Result:', result);
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createMetabaseForLatestTable();

