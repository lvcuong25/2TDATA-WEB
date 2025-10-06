import { sequelize, Column } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkTableColumns() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
    
    // Get columns from PostgreSQL
    const columns = await Column.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });
    
    console.log(`\n📋 Columns in PostgreSQL table ${tableId}:`);
    columns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name} (${col.data_type}) - type: ${col.type}`);
    });
    
    // Check Metabase table columns
    const [metabaseColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'quang_trung_test_schema_9c80b006' 
      AND table_name = 'metabase_test_table_schema_8739b0d9'
      AND column_name NOT IN ('id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at')
      ORDER BY column_name
    `);
    
    console.log(`\n📋 Columns in Metabase table:`);
    metabaseColumns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type})`);
    });
    
    // Compare
    const pgColumnNames = columns.map(col => col.name);
    const mbColumnNames = metabaseColumns.map(col => col.column_name);
    
    console.log(`\n🔍 Comparison:`);
    console.log(`   PostgreSQL columns: ${pgColumnNames.join(', ')}`);
    console.log(`   Metabase columns: ${mbColumnNames.join(', ')}`);
    
    const missingInMetabase = pgColumnNames.filter(name => !mbColumnNames.includes(name));
    const extraInMetabase = mbColumnNames.filter(name => !pgColumnNames.includes(name));
    
    if (missingInMetabase.length > 0) {
      console.log(`   ❌ Missing in Metabase: ${missingInMetabase.join(', ')}`);
    }
    if (extraInMetabase.length > 0) {
      console.log(`   ⚠️ Extra in Metabase: ${extraInMetabase.join(', ')}`);
    }
    if (missingInMetabase.length === 0 && extraInMetabase.length === 0) {
      console.log(`   ✅ Columns match perfectly!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTableColumns();



