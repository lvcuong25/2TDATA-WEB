import dotenv from 'dotenv';

dotenv.config();

// Set environment variables for PostgreSQL
process.env.PG_DATABASE = process.env.POSTGRES_DB;
process.env.PG_USER = process.env.POSTGRES_USER;
process.env.PG_PASSWORD = process.env.POSTGRES_PASSWORD;
process.env.PG_HOST = process.env.POSTGRES_HOST;
process.env.PG_PORT = process.env.POSTGRES_PORT;

console.log('🧪 Testing real-time sync functionality...\n');

try {
  // Import models and utilities
  const { sequelize, Table, Column, Record } = await import('./src/models/postgres/index.js');
  const { createMetabaseTable, updateMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
  
  // Connect to PostgreSQL
  await sequelize.authenticate();
  console.log('✅ Connected to PostgreSQL');
  
  // Find postgresX table
  const postgresXTable = await Table.findOne({ where: { name: 'postgresX' } });
  
  if (!postgresXTable) {
    console.log('❌ postgresX table not found');
    process.exit(1);
  }
  
  console.log(`📋 Testing with postgresX table: ${postgresXTable.id}`);
  
  // Test 1: Check if updateMetabaseTable works for existing records
  console.log('\n🧪 Test 1: Testing updateMetabaseTable for existing records...');
  
  const records = await Record.findAll({ where: { table_id: postgresXTable.id } });
  console.log(`   Found ${records.length} records in PostgreSQL`);
  
  for (let i = 0; i < Math.min(2, records.length); i++) {
    const record = records[i];
    console.log(`   Testing record ${i + 1}: ${record.id}`);
    
    try {
      const updateResult = await updateMetabaseTable(
        postgresXTable.id,
        {
          id: record.id,
          table_id: record.table_id,
          user_id: record.user_id,
          site_id: record.site_id,
          data: record.data,
          created_at: record.created_at,
          updated_at: record.updated_at
        },
        'insert'
      );
      
      if (updateResult.success) {
        console.log(`     ✅ updateMetabaseTable successful`);
      } else {
        console.log(`     ❌ updateMetabaseTable failed: ${updateResult.error}`);
      }
    } catch (error) {
      console.log(`     ❌ updateMetabaseTable error: ${error.message}`);
    }
  }
  
  // Test 2: Check if createMetabaseTable works with current data
  console.log('\n🧪 Test 2: Testing createMetabaseTable with current data...');
  
  try {
    const metabaseResult = await createMetabaseTable(
      postgresXTable.id,
      postgresXTable.name,
      'test-realtime-sync'
    );
    
    if (metabaseResult.success) {
      console.log(`   ✅ createMetabaseTable successful:`);
      console.log(`     - Table name: ${metabaseResult.metabaseTableName}`);
      console.log(`     - Record count: ${metabaseResult.recordCount}`);
      console.log(`     - Column count: ${metabaseResult.columnCount}`);
    } else {
      console.log(`   ❌ createMetabaseTable failed: ${metabaseResult.error}`);
    }
  } catch (error) {
    console.log(`   ❌ createMetabaseTable error: ${error.message}`);
  }
  
  // Test 3: Verify final state
  console.log('\n🧪 Test 3: Verifying final state...');
  
  const expectedMetabaseTableName = `metabase_postgresx_${postgresXTable.id.slice(-8)}`;
  const [finalRowCount] = await sequelize.query(`SELECT COUNT(*) as count FROM "${expectedMetabaseTableName}"`);
  
  console.log(`   - PostgreSQL records: ${records.length}`);
  console.log(`   - Metabase records: ${finalRowCount[0].count}`);
  
  if (records.length === finalRowCount[0].count) {
    console.log(`   ✅ Records are now in sync!`);
  } else {
    console.log(`   ❌ Records still not in sync`);
  }
  
  // Check columns
  const columns = await Column.findAll({ where: { table_id: postgresXTable.id } });
  const postgresColumnNames = columns.map(col => col.name);
  
  const [metabaseColumns] = await sequelize.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = '${expectedMetabaseTableName}' 
    AND table_schema = 'public'
    AND column_name NOT IN ('id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at')
  `);
  const metabaseColumnNames = metabaseColumns.map(col => col.column_name);
  
  console.log(`   - PostgreSQL columns: ${postgresColumnNames.join(', ')}`);
  console.log(`   - Metabase columns: ${metabaseColumnNames.join(', ')}`);
  
  const missingInMetabase = postgresColumnNames.filter(name => !metabaseColumnNames.includes(name.replace(/[^a-zA-Z0-9_]/g, '_')));
  if (missingInMetabase.length === 0) {
    console.log(`   ✅ All columns are now in sync!`);
  } else {
    console.log(`   ❌ Missing columns in Metabase: ${missingInMetabase.join(', ')}`);
  }
  
  await sequelize.close();
  console.log('\n✅ PostgreSQL disconnected');
  
} catch (error) {
  console.error('❌ Test failed:', error);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
}

console.log('\n🎉 Real-time sync test completed!');
