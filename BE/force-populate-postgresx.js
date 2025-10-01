import dotenv from 'dotenv';

dotenv.config();

// Set environment variables for PostgreSQL
process.env.PG_DATABASE = process.env.POSTGRES_DB;
process.env.PG_USER = process.env.POSTGRES_USER;
process.env.PG_PASSWORD = process.env.POSTGRES_PASSWORD;
process.env.PG_HOST = process.env.POSTGRES_HOST;
process.env.PG_PORT = process.env.POSTGRES_PORT;

console.log('🚀 Force populating postgresX Metabase table...\n');

try {
  // Import PostgreSQL models
  const { sequelize, Table, Column, Record } = await import('./src/models/postgres/index.js');
  const { createMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
  
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
  
  // Get columns and records
  const [columns, records] = await Promise.all([
    Column.findAll({ where: { table_id: postgresXTable.id } }),
    Record.findAll({ where: { table_id: postgresXTable.id } })
  ]);
  
  console.log(`   - Columns: ${columns.length}`);
  console.log(`   - Records: ${records.length}`);
  
  if (records.length === 0) {
    console.log('❌ No records found in postgresX table');
    process.exit(1);
  }
  
  // Show sample data
  console.log('\n📊 Sample data:');
  records.forEach((record, index) => {
    console.log(`   Record ${index + 1}:`, record.data);
  });
  
  // Force recreate Metabase table
  console.log('\n🔄 Force recreating Metabase table...');
  
  const metabaseResult = await createMetabaseTable(
    postgresXTable.id,
    postgresXTable.name,
    'force-populate'
  );
  
  if (metabaseResult.success) {
    console.log('✅ Metabase table recreated successfully:');
    console.log(`   - Table name: ${metabaseResult.metabaseTableName}`);
    console.log(`   - Data fields: ${metabaseResult.dataFields.join(', ')}`);
    console.log(`   - Record count: ${metabaseResult.recordCount}`);
    console.log(`   - Column count: ${metabaseResult.columnCount}`);
  } else {
    console.log('❌ Failed to recreate Metabase table:', metabaseResult.error);
  }
  
  // Verify the result
  console.log('\n📊 Verification:');
  const expectedMetabaseTableName = `metabase_postgresx_${postgresXTable.id.slice(-8)}`;
  const [rowCount] = await sequelize.query(`SELECT COUNT(*) as count FROM "${expectedMetabaseTableName}"`);
  console.log(`   ${expectedMetabaseTableName}: ${rowCount[0].count} rows`);
  
  if (rowCount[0].count > 0) {
    // Show sample data from Metabase table
    const [sampleData] = await sequelize.query(`SELECT * FROM "${expectedMetabaseTableName}" LIMIT 2`);
    console.log('\n📋 Sample data in Metabase table:');
    sampleData.forEach((row, index) => {
      console.log(`   Row ${index + 1}:`, row);
    });
  }
  
  await sequelize.close();
  console.log('\n✅ PostgreSQL disconnected');
  
} catch (error) {
  console.error('❌ Force population failed:', error);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
}

console.log('\n🎉 Force population completed!');
