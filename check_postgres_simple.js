const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: '2tdata_postgres',
  user: 'postgres',
  password: 'Ahiho123@'
});

async function checkPostgresData() {
  try {
    console.log('🔄 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL successfully!');

    // Check database info
    console.log('\n📊 Database Information:');
    const dbInfo = await client.query('SELECT current_database(), current_user, version()');
    console.log(`Database: ${dbInfo.rows[0].current_database}`);
    console.log(`User: ${dbInfo.rows[0].current_user}`);
    console.log(`Version: ${dbInfo.rows[0].version.split(' ')[0]} ${dbInfo.rows[0].version.split(' ')[1]}`);

    // Count tables
    console.log('\n📋 Tables Summary:');
    const tablesCount = await client.query('SELECT COUNT(*) as total FROM tables');
    console.log(`Total Tables: ${tablesCount.rows[0].total}`);

    const columnsCount = await client.query('SELECT COUNT(*) as total FROM columns');
    console.log(`Total Columns: ${columnsCount.rows[0].total}`);

    const recordsCount = await client.query('SELECT COUNT(*) as total FROM records');
    console.log(`Total Records: ${recordsCount.rows[0].total}`);

    const rowsCount = await client.query('SELECT COUNT(*) as total FROM rows');
    console.log(`Total Rows: ${rowsCount.rows[0].total}`);

    // Show sample tables
    console.log('\n🗂️ Sample Tables:');
    const sampleTables = await client.query(`
      SELECT name, database_id, created_at 
      FROM tables 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    sampleTables.rows.forEach((table, index) => {
      console.log(`${index + 1}. ${table.name} (ID: ${table.database_id})`);
      console.log(`   Created: ${new Date(table.created_at).toLocaleString()}`);
    });

    // Show sample columns
    console.log('\n📝 Sample Columns:');
    const sampleColumns = await client.query(`
      SELECT t.name as table_name, c.name as column_name, c.type, c.data_type
      FROM columns c
      JOIN tables t ON c.table_id = t.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);
    
    sampleColumns.rows.forEach((col, index) => {
      console.log(`${index + 1}. Table: ${col.table_name}`);
      console.log(`   Column: ${col.column_name} (${col.type}/${col.data_type})`);
    });

    // Show sample records
    console.log('\n📄 Sample Records:');
    const sampleRecords = await client.query(`
      SELECT t.name as table_name, r.data
      FROM records r
      JOIN tables t ON r.table_id = t.id
      ORDER BY r.created_at DESC
      LIMIT 3
    `);
    
    sampleRecords.rows.forEach((record, index) => {
      console.log(`${index + 1}. Table: ${record.table_name}`);
      console.log(`   Data: ${JSON.stringify(record.data, null, 2)}`);
    });

    console.log('\n✅ PostgreSQL data check completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Disconnected from PostgreSQL');
  }
}

checkPostgresData();