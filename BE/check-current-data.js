import dotenv from 'dotenv';

dotenv.config();

// Set environment variables for PostgreSQL
process.env.PG_DATABASE = process.env.POSTGRES_DB;
process.env.PG_USER = process.env.POSTGRES_USER;
process.env.PG_PASSWORD = process.env.POSTGRES_PASSWORD;
process.env.PG_HOST = process.env.POSTGRES_HOST;
process.env.PG_PORT = process.env.POSTGRES_PORT;

console.log('🔍 Checking current data in PostgreSQL and Metabase...\n');

try {
  // Import PostgreSQL models
  const { sequelize, Table, Column, Record } = await import('./src/models/postgres/index.js');
  
  // Connect to PostgreSQL
  await sequelize.authenticate();
  console.log('✅ Connected to PostgreSQL');
  
  // Find postgresX table
  const postgresXTable = await Table.findOne({ where: { name: 'postgresX' } });
  
  if (!postgresXTable) {
    console.log('❌ postgresX table not found');
    process.exit(1);
  }
  
  console.log(`📋 Found postgresX table: ${postgresXTable.id}`);
  
  // Get current columns and records
  const [columns, records] = await Promise.all([
    Column.findAll({ where: { table_id: postgresXTable.id } }),
    Record.findAll({ where: { table_id: postgresXTable.id } })
  ]);
  
  console.log(`\n📊 Current PostgreSQL data:`);
  console.log(`   - Columns: ${columns.length}`);
  columns.forEach((col, index) => {
    console.log(`     ${index + 1}. ${col.name} (${col.data_type})`);
  });
  
  console.log(`   - Records: ${records.length}`);
  records.forEach((record, index) => {
    console.log(`     ${index + 1}. ID: ${record.id}`);
    console.log(`        Data:`, record.data);
  });
  
  // Check Metabase table
  const expectedMetabaseTableName = `metabase_postgresx_${postgresXTable.id.slice(-8)}`;
  console.log(`\n📊 Current Metabase table: ${expectedMetabaseTableName}`);
  
  const [metabaseRowCount] = await sequelize.query(`SELECT COUNT(*) as count FROM "${expectedMetabaseTableName}"`);
  console.log(`   - Rows in Metabase: ${metabaseRowCount[0].count}`);
  
  if (metabaseRowCount[0].count > 0) {
    const [metabaseData] = await sequelize.query(`SELECT * FROM "${expectedMetabaseTableName}" ORDER BY id`);
    console.log(`   - Sample Metabase data:`);
    metabaseData.forEach((row, index) => {
      console.log(`     ${index + 1}. ID: ${row.id}`);
      console.log(`        Data fields:`, Object.keys(row).filter(key => !['id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at'].includes(key)));
    });
  }
  
  // Compare data
  console.log(`\n🔍 Data comparison:`);
  console.log(`   - PostgreSQL records: ${records.length}`);
  console.log(`   - Metabase records: ${metabaseRowCount[0].count}`);
  
  if (records.length !== metabaseRowCount[0].count) {
    console.log(`   ⚠️ MISMATCH: PostgreSQL has ${records.length} records but Metabase has ${metabaseRowCount[0].count} records`);
    console.log(`   🔧 Real-time sync is NOT working properly`);
  } else {
    console.log(`   ✅ Records count matches`);
  }
  
  // Check for new columns
  const postgresColumnNames = columns.map(col => col.name);
  if (metabaseRowCount[0].count > 0) {
    const [metabaseColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${expectedMetabaseTableName}' 
      AND table_schema = 'public'
      AND column_name NOT IN ('id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at')
    `);
    const metabaseColumnNames = metabaseColumns.map(col => col.column_name);
    
    console.log(`\n🔍 Column comparison:`);
    console.log(`   - PostgreSQL columns: ${postgresColumnNames.join(', ')}`);
    console.log(`   - Metabase columns: ${metabaseColumnNames.join(', ')}`);
    
    const missingInMetabase = postgresColumnNames.filter(name => !metabaseColumnNames.includes(name.replace(/[^a-zA-Z0-9_]/g, '_')));
    if (missingInMetabase.length > 0) {
      console.log(`   ⚠️ MISSING in Metabase: ${missingInMetabase.join(', ')}`);
      console.log(`   🔧 Column sync is NOT working properly`);
    } else {
      console.log(`   ✅ All columns are synced`);
    }
  }
  
  await sequelize.close();
  console.log('\n✅ PostgreSQL disconnected');
  
} catch (error) {
  console.error('❌ Check failed:', error);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
}

console.log('\n🎉 Data check completed!');
