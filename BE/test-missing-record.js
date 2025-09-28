import dotenv from 'dotenv';

dotenv.config();

// Set environment variables for PostgreSQL
process.env.PG_DATABASE = process.env.POSTGRES_DB;
process.env.PG_USER = process.env.POSTGRES_USER;
process.env.PG_PASSWORD = process.env.POSTGRES_PASSWORD;
process.env.PG_HOST = process.env.POSTGRES_HOST;
process.env.PG_PORT = process.env.POSTGRES_PORT;

console.log('🔍 Testing missing record sync...\n');

try {
  // Import PostgreSQL models
  const { sequelize, Table, Column, Record } = await import('./src/models/postgres/index.js');
  const { updateMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
  
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
  
  // Get all records
  const records = await Record.findAll({ where: { table_id: postgresXTable.id } });
  console.log(`📊 Found ${records.length} records in PostgreSQL`);
  
  // Check which records are in Metabase
  const expectedMetabaseTableName = `metabase_postgresx_${postgresXTable.id.slice(-8)}`;
  const [metabaseRecords] = await sequelize.query(`SELECT id FROM "${expectedMetabaseTableName}"`);
  const metabaseRecordIds = metabaseRecords.map(r => r.id);
  
  console.log(`📊 Found ${metabaseRecordIds.length} records in Metabase`);
  console.log(`   Metabase record IDs: ${metabaseRecordIds.join(', ')}`);
  
  // Find missing records
  const missingRecords = records.filter(record => !metabaseRecordIds.includes(record.id));
  console.log(`\n🔍 Missing records: ${missingRecords.length}`);
  
  for (const record of missingRecords) {
    console.log(`\n🔄 Syncing missing record: ${record.id}`);
    console.log(`   Data:`, record.data);
    
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
        console.log(`   ✅ Successfully synced record ${record.id}`);
      } else {
        console.log(`   ❌ Failed to sync record ${record.id}: ${updateResult.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Error syncing record ${record.id}: ${error.message}`);
    }
  }
  
  // Final verification
  console.log('\n📊 Final verification:');
  const [finalMetabaseRecords] = await sequelize.query(`SELECT COUNT(*) as count FROM "${expectedMetabaseTableName}"`);
  console.log(`   - PostgreSQL records: ${records.length}`);
  console.log(`   - Metabase records: ${finalMetabaseRecords[0].count}`);
  
  if (records.length === finalMetabaseRecords[0].count) {
    console.log(`   ✅ All records are now in sync!`);
  } else {
    console.log(`   ❌ Records still not in sync`);
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

console.log('\n🎉 Missing record test completed!');
