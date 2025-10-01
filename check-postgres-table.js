import { Table as PostgresTable, Column as PostgresColumn } from './BE/src/models/postgres/index.js';

async function checkTable() {
  try {
    console.log('🔍 Checking if table exists in PostgreSQL...');
    
    const tableId = 'a3fcbc8f-1a41-428e-9bf2-e4210e1f8c7f';
    
    const table = await PostgresTable.findByPk(tableId);
    console.log('Table found:', table ? 'Yes' : 'No');
    
    if (table) {
      console.log('Table name:', table.name);
      console.log('Table database_id:', table.database_id);
    }
    
    const columns = await PostgresColumn.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });
    
    console.log('Columns found:', columns.length);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTable();
