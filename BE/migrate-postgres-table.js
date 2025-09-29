import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });
dotenv.config();

console.log('🔄 Migrating Postgres table from MongoDB to PostgreSQL...');
console.log('======================================================');

async function migratePostgresTable() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/2TDATA-P';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Find Postgres table in MongoDB
    const TableModel = mongoose.model('Table', new mongoose.Schema({}, { strict: false }));
    const mongoTable = await TableModel.findOne({ name: 'Postgres' });

    if (!mongoTable) {
      console.log('❌ Postgres table not found in MongoDB');
      return;
    }

    console.log(`📊 Found Postgres table in MongoDB: ${mongoTable.name} (${mongoTable._id})`);

    // Check if table already exists in PostgreSQL
    const existingTable = await Table.findOne({ where: { id: mongoTable._id.toString() } });
    if (existingTable) {
      console.log('⚠️ Postgres table already exists in PostgreSQL');
      return;
    }

    // Create table in PostgreSQL
    const postgresTable = await Table.create({
      id: mongoTable._id.toString(),
      name: mongoTable.name,
      database_id: (mongoTable.baseId || mongoTable.databaseId)?.toString(),
      user_id: mongoTable.userId?.toString(),
      site_id: mongoTable.siteId?.toString(),
      description: mongoTable.description || '',
      table_access_rule: mongoTable.tableAccessRule || {
        userIds: [],
        allUsers: false,
        access: []
      },
      column_access_rules: mongoTable.columnAccessRules || [],
      record_access_rules: mongoTable.recordAccessRules || [],
      cell_access_rules: mongoTable.cellAccessRules || []
    });

    console.log(`✅ Created Postgres table in PostgreSQL: ${postgresTable.name} (${postgresTable.id})`);

    // Find columns for this table in MongoDB
    const ColumnModel = mongoose.model('Column', new mongoose.Schema({}, { strict: false }));
    const mongoColumns = await ColumnModel.find({ tableId: mongoTable._id });

    console.log(`📋 Found ${mongoColumns.length} columns in MongoDB`);

    // Create columns in PostgreSQL
    for (const mongoColumn of mongoColumns) {
      const existingColumn = await Column.findOne({ where: { id: mongoColumn._id.toString() } });
      if (existingColumn) {
        console.log(`⚠️ Column ${mongoColumn.name} already exists in PostgreSQL`);
        continue;
      }

      const postgresColumn = await Column.create({
        id: mongoColumn._id.toString(),
        name: mongoColumn.name,
        key: mongoColumn.key || mongoColumn.name?.toLowerCase().replace(/\s+/g, '_'),
        type: mongoColumn.type || 'string',
        data_type: mongoColumn.dataType || mongoColumn.type || 'text',
        table_id: mongoColumn.tableId?.toString(),
        user_id: mongoColumn.userId?.toString(),
        site_id: mongoColumn.siteId?.toString(),
        is_required: mongoColumn.isRequired || false,
        is_unique: mongoColumn.isUnique || false,
        default_value: mongoColumn.defaultValue,
        checkbox_config: mongoColumn.checkboxConfig,
        single_select_config: mongoColumn.singleSelectConfig,
        multi_select_config: mongoColumn.multiSelectConfig,
        formula_config: mongoColumn.formulaConfig,
        date_config: mongoColumn.dateConfig,
        currency_config: mongoColumn.currencyConfig,
        percent_config: mongoColumn.percentConfig,
        url_config: mongoColumn.urlConfig,
        phone_config: mongoColumn.phoneConfig,
        time_config: mongoColumn.timeConfig,
        rating_config: mongoColumn.ratingConfig,
        linked_table_config: mongoColumn.linkedTableConfig,
        lookup_config: mongoColumn.lookupConfig,
        order: mongoColumn.order || 0
      });

      console.log(`✅ Created column: ${postgresColumn.name} (${postgresColumn.data_type})`);
    }

    // Find records for this table in MongoDB
    const RecordModel = mongoose.model('Record', new mongoose.Schema({}, { strict: false }));
    const mongoRecords = await RecordModel.find({ tableId: mongoTable._id });

    console.log(`📝 Found ${mongoRecords.length} records in MongoDB`);

    // Create records in PostgreSQL
    for (const mongoRecord of mongoRecords) {
      const existingRecord = await Record.findOne({ where: { id: mongoRecord._id.toString() } });
      if (existingRecord) {
        console.log(`⚠️ Record ${mongoRecord._id} already exists in PostgreSQL`);
        continue;
      }

      const postgresRecord = await Record.create({
        id: mongoRecord._id.toString(),
        table_id: mongoRecord.tableId?.toString(),
        user_id: mongoRecord.userId?.toString(),
        site_id: mongoRecord.siteId?.toString(),
        data: mongoRecord.data || {},
        created_at: mongoRecord.createdAt,
        updated_at: mongoRecord.updatedAt
      });

      console.log(`✅ Created record: ${postgresRecord.id}`);
    }

    console.log('\n🎉 Postgres table migration completed!');
    console.log('=====================================');
    console.log(`✅ Table: ${postgresTable.name}`);
    console.log(`✅ Columns: ${mongoColumns.length}`);
    console.log(`✅ Records: ${mongoRecords.length}`);

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
  }
}

migratePostgresTable().catch(console.error);

