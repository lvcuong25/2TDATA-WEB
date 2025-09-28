import dotenv from 'dotenv';

dotenv.config();

// Set environment variables for PostgreSQL
process.env.PG_DATABASE = process.env.POSTGRES_DB;
process.env.PG_USER = process.env.POSTGRES_USER;
process.env.PG_PASSWORD = process.env.POSTGRES_PASSWORD;
process.env.PG_HOST = process.env.POSTGRES_HOST;
process.env.PG_PORT = process.env.POSTGRES_PORT;

console.log('🧪 Testing Metabase sync directly...\n');

try {
  // Import PostgreSQL models and Metabase utilities
  const { sequelize, Table, Column, Record } = await import('./src/models/postgres/index.js');
  const { updateMetabaseTable, createMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
  
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
  
  // Get the latest record
  const latestRecord = await Record.findOne({ 
    where: { table_id: postgresXTable.id },
    order: [['created_at', 'DESC']]
  });
  
  if (!latestRecord) {
    console.log('❌ No records found');
    process.exit(1);
  }
  
  console.log(`📊 Latest record: ${latestRecord.id}`);
  console.log(`   Data:`, latestRecord.data);
  
  // Test updateMetabaseTable directly
  console.log('\n🔄 Testing updateMetabaseTable directly...');
  
  const metabaseRecord = {
    id: latestRecord.id,
    table_id: latestRecord.table_id,
    user_id: latestRecord.user_id,
    site_id: latestRecord.site_id,
    data: latestRecord.data,
    created_at: latestRecord.created_at,
    updated_at: latestRecord.updated_at
  };
  
  try {
    const result = await updateMetabaseTable(
      postgresXTable.id,
      metabaseRecord,
      'insert'
    );
    
    if (result.success) {
      console.log('   ✅ updateMetabaseTable successful');
      console.log(`   Result:`, result);
    } else {
      console.log('   ❌ updateMetabaseTable failed');
      console.log(`   Error:`, result.error);
    }
  } catch (error) {
    console.log('   ❌ updateMetabaseTable error:');
    console.log(`   Error:`, error.message);
    console.log(`   Stack:`, error.stack);
  }
  
  // Check final state
  console.log('\n📊 Final verification:');
  const expectedMetabaseTableName = `metabase_postgresx_${postgresXTable.id.slice(-8)}`;
  const [finalRowCount] = await sequelize.query(`SELECT COUNT(*) as count FROM "${expectedMetabaseTableName}"`);
  
  console.log(`   - PostgreSQL records: ${await Record.count({ where: { table_id: postgresXTable.id } })}`);
  console.log(`   - Metabase records: ${finalRowCount[0].count}`);
  
  if (finalRowCount[0].count > 0) {
    console.log('\n📋 Sample Metabase data:');
    const [sampleData] = await sequelize.query(`SELECT * FROM "${expectedMetabaseTableName}" ORDER BY id DESC LIMIT 3`);
    sampleData.forEach((row, index) => {
      console.log(`   Row ${index + 1}: ID=${row.id}, Data fields=${Object.keys(row).filter(key => !['id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at'].includes(key)).join(', ')}`);
    });
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

console.log('\n🎉 Direct Metabase test completed!');
