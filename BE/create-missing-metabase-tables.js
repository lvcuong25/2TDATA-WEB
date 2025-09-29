import { sequelize } from './src/models/postgres/index.js';
import { createMetabaseTable } from './src/utils/metabaseTableCreator.js';

async function createMissingMetabaseTables() {
  try {
    console.log('🎯 Creating missing Metabase tables...');
    
    // Get all tables
    const [tables] = await sequelize.query(`
      SELECT * FROM tables 
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Found ${tables.length} tables`);
    
    // Get existing Metabase tables
    const [metabaseTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'metabase_%'
    `);
    
    const existingMetabaseTableIds = metabaseTables.map(t => {
      // Extract table ID from metabase table name (last 8 characters)
      const match = t.table_name.match(/_([a-f0-9]{8})$/);
      return match ? match[1] : null;
    }).filter(Boolean);
    
    console.log(`📊 Found ${metabaseTables.length} existing Metabase tables`);
    console.log('📋 Existing Metabase table IDs:', existingMetabaseTableIds);
    
    // Find tables without Metabase tables
    const tablesWithoutMetabase = tables.filter(table => {
      const tableIdSuffix = table.id.slice(-8);
      return !existingMetabaseTableIds.includes(tableIdSuffix);
    });
    
    console.log(`📊 Found ${tablesWithoutMetabase.length} tables without Metabase tables`);
    
    // Create Metabase tables for missing ones
    for (const table of tablesWithoutMetabase) {
      console.log(`\n🔄 Creating Metabase table for: ${table.name} (${table.id})`);
      
      // Get columns for this table
      const [columns] = await sequelize.query(`
        SELECT * FROM columns 
        WHERE table_id = '${table.id}'
        ORDER BY "order" ASC
      `);
      
      // Get records for this table
      const [records] = await sequelize.query(`
        SELECT * FROM records 
        WHERE table_id = '${table.id}'
        ORDER BY created_at ASC
      `);
      
      console.log(`📋 Columns: ${columns.length}, Records: ${records.length}`);
      
      // Create Metabase table
      const result = await createMetabaseTable(table, columns, records);
      
      if (result.success) {
        console.log(`✅ Created: ${result.metabaseTableName}`);
      } else {
        console.error(`❌ Failed: ${result.error}`);
      }
    }
    
    console.log('\n🎉 Finished creating missing Metabase tables!');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createMissingMetabaseTables();

