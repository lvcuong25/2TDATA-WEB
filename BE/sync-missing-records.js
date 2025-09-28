import dotenv from 'dotenv';

dotenv.config();

// Set environment variables for PostgreSQL
process.env.PG_DATABASE = process.env.POSTGRES_DB;
process.env.PG_USER = process.env.POSTGRES_USER;
process.env.PG_PASSWORD = process.env.POSTGRES_PASSWORD;
process.env.PG_HOST = process.env.POSTGRES_HOST;
process.env.PG_PORT = process.env.POSTGRES_PORT;

console.log('🔄 Syncing missing records to Metabase...\n');

try {
  // Import PostgreSQL models and Metabase utilities
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
  
  console.log(`📋 Syncing records for table: ${postgresXTable.id}`);
  
  // Get all records from PostgreSQL
  const allRecords = await Record.findAll({ 
    where: { table_id: postgresXTable.id },
    order: [['created_at', 'ASC']]
  });
  
  console.log(`📊 Found ${allRecords.length} records in PostgreSQL`);
  
  // Get all records from Metabase
  const expectedMetabaseTableName = `metabase_postgresx_${postgresXTable.id.slice(-8)}`;
  const [metabaseRecords] = await sequelize.query(`SELECT id FROM "${expectedMetabaseTableName}"`);
  const metabaseRecordIds = metabaseRecords.map(r => r.id);
  
  console.log(`📊 Found ${metabaseRecordIds.length} records in Metabase`);
  
  // Find missing records
  const missingRecords = allRecords.filter(record => !metabaseRecordIds.includes(record.id));
  
  console.log(`🔍 Found ${missingRecords.length} missing records`);
  
  if (missingRecords.length === 0) {
    console.log('✅ All records are already synced!');
  } else {
    console.log('\n🔄 Syncing missing records...');
    
    for (const record of missingRecords) {
      console.log(`   Syncing record: ${record.id}`);
      
      const metabaseRecord = {
        id: record.id,
        table_id: record.table_id,
        user_id: record.user_id,
        site_id: record.site_id,
        data: record.data,
        created_at: record.created_at,
        updated_at: record.updated_at
      };
      
      try {
        const result = await updateMetabaseTable(
          postgresXTable.id,
          metabaseRecord,
          'insert'
        );
        
        if (result.success) {
          console.log(`     ✅ Synced successfully`);
        } else {
          console.log(`     ❌ Sync failed: ${result.error}`);
        }
      } catch (error) {
        console.log(`     ❌ Sync error: ${error.message}`);
      }
    }
  }
  
  // Final verification
  console.log('\n📊 Final verification:');
  const [finalRowCount] = await sequelize.query(`SELECT COUNT(*) as count FROM "${expectedMetabaseTableName}"`);
  
  console.log(`   - PostgreSQL records: ${allRecords.length}`);
  console.log(`   - Metabase records: ${finalRowCount[0].count}`);
  
  if (allRecords.length === finalRowCount[0].count) {
    console.log('   ✅ All records are now synced!');
  } else {
    console.log(`   ❌ Still missing ${allRecords.length - finalRowCount[0].count} records`);
  }
  
  await sequelize.close();
  console.log('\n✅ PostgreSQL disconnected');
  
} catch (error) {
  console.error('❌ Sync failed:', error);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
}

console.log('\n🎉 Missing records sync completed!');
