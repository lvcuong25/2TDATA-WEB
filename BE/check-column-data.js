import { Column as PostgresColumn, Table as PostgresTable, sequelize } from './src/models/postgres/index.js';

console.log('=== CHECKING COLUMN DATA ===');

async function checkColumnData() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    const columnId = '49a7af36-b485-4083-8aea-3f6b7f4acb4c';
    
    console.log(`\n🔍 Checking column: ${columnId}`);
    const column = await PostgresColumn.findByPk(columnId);
    
    if (!column) {
      console.log('❌ Column not found');
      return;
    }
    
    console.log('✅ Column found:');
    console.log('  - ID:', column.id);
    console.log('  - Name:', column.name);
    console.log('  - Table ID:', column.table_id);
    console.log('  - Database ID:', column.database_id);
    console.log('  - Created At:', column.created_at);
    console.log('  - Updated At:', column.updated_at);
    
    // Check table
    if (column.table_id) {
      console.log(`\n🔍 Checking table: ${column.table_id}`);
      const table = await PostgresTable.findByPk(column.table_id);
      
      if (table) {
        console.log('✅ Table found:');
        console.log('  - ID:', table.id);
        console.log('  - Name:', table.name);
        console.log('  - Database ID:', table.database_id);
      } else {
        console.log('❌ Table not found');
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkColumnData();
