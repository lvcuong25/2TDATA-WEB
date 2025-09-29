import mongoose from 'mongoose';
import { sequelize, Table, Column, Record, Row } from '../models/postgres/index.js';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Models (assuming they exist)
const BaseSchema = new mongoose.Schema({}, { strict: false });
const TableSchema = new mongoose.Schema({}, { strict: false });
const ColumnSchema = new mongoose.Schema({}, { strict: false });
const RecordSchema = new mongoose.Schema({}, { strict: false });
const RowSchema = new mongoose.Schema({}, { strict: false });

const Base = mongoose.model('Base', BaseSchema);
const TableModel = mongoose.model('Table', TableSchema);
const ColumnModel = mongoose.model('Column', ColumnSchema);
const RecordModel = mongoose.model('Record', RecordSchema);
const RowModel = mongoose.model('Row', RowSchema);

class TableMigration {
  constructor() {
    this.stats = {
      tables: { migrated: 0, errors: 0 },
      columns: { migrated: 0, errors: 0 },
      records: { migrated: 0, errors: 0 },
      rows: { migrated: 0, errors: 0 }
    };
  }

  async connect() {
    try {
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');

      // Connect to PostgreSQL
      await sequelize.authenticate();
      console.log('✅ Connected to PostgreSQL');

      // Sync PostgreSQL models
      await sequelize.sync({ force: false });
      console.log('✅ PostgreSQL models synchronized');
    } catch (error) {
      console.error('❌ Connection error:', error);
      throw error;
    }
  }

  async migrateTables() {
    console.log('🔄 Starting table migration...');
    
    try {
      const tables = await TableModel.find({}).lean();
      console.log(`📊 Found ${tables.length} tables to migrate`);

      for (const table of tables) {
        try {
          const postgresTable = await Table.create({
            id: table._id,
            name: table.name || 'Unnamed Table',
            database_id: table.baseId || table.databaseId,
            user_id: table.userId,
            site_id: table.siteId,
            table_access_rule: table.tableAccessRule || {
              userIds: [],
              allUsers: false,
              access: []
            },
            column_access_rules: table.columnAccessRules || [],
            record_access_rules: table.recordAccessRules || [],
            cell_access_rules: table.cellAccessRules || [],
            description: table.description || '',
            created_at: table.createdAt,
            updated_at: table.updatedAt
          });

          this.stats.tables.migrated++;
          console.log(`✅ Migrated table: ${table.name} (${table._id})`);
        } catch (error) {
          this.stats.tables.errors++;
          console.error(`❌ Error migrating table ${table._id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error in table migration:', error);
      throw error;
    }
  }

  async migrateColumns() {
    console.log('🔄 Starting column migration...');
    
    try {
      const columns = await ColumnModel.find({}).lean();
      console.log(`📊 Found ${columns.length} columns to migrate`);

      for (const column of columns) {
        try {
          const postgresColumn = await Column.create({
            id: column._id,
            name: column.name || 'Unnamed Column',
            key: column.key || column.name?.toLowerCase().replace(/\s+/g, '_'),
            type: this.mapColumnType(column.type),
            table_id: column.tableId,
            user_id: column.userId,
            site_id: column.siteId,
            data_type: column.dataType || column.type || 'string',
            is_required: column.isRequired || false,
            is_unique: column.isUnique || false,
            default_value: column.defaultValue,
            checkbox_config: column.checkboxConfig,
            single_select_config: column.singleSelectConfig,
            multi_select_config: column.multiSelectConfig,
            formula_config: column.formulaConfig,
            date_config: column.dateConfig,
            currency_config: column.currencyConfig,
            percent_config: column.percentConfig,
            url_config: column.urlConfig,
            phone_config: column.phoneConfig,
            time_config: column.timeConfig,
            rating_config: column.ratingConfig,
            linked_table_config: column.linkedTableConfig,
            lookup_config: column.lookupConfig,
            order: column.order || 0,
            created_at: column.createdAt,
            updated_at: column.updatedAt
          });

          this.stats.columns.migrated++;
          console.log(`✅ Migrated column: ${column.name} (${column._id})`);
        } catch (error) {
          this.stats.columns.errors++;
          console.error(`❌ Error migrating column ${column._id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error in column migration:', error);
      throw error;
    }
  }

  async migrateRecords() {
    console.log('🔄 Starting record migration...');
    
    try {
      const records = await RecordModel.find({}).lean();
      console.log(`📊 Found ${records.length} records to migrate`);

      for (const record of records) {
        try {
          const postgresRecord = await Record.create({
            id: record._id,
            table_id: record.tableId,
            user_id: record.userId,
            site_id: record.siteId,
            data: record.data || {},
            created_at: record.createdAt,
            updated_at: record.updatedAt
          });

          this.stats.records.migrated++;
          console.log(`✅ Migrated record: ${record._id}`);
        } catch (error) {
          this.stats.records.errors++;
          console.error(`❌ Error migrating record ${record._id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error in record migration:', error);
      throw error;
    }
  }

  async migrateRows() {
    console.log('🔄 Starting row migration...');
    
    try {
      const rows = await RowModel.find({}).lean();
      console.log(`📊 Found ${rows.length} rows to migrate`);

      for (const row of rows) {
        try {
          const postgresRow = await Row.create({
            id: row._id,
            table_id: row.tableId,
            data: row.data || {},
            created_by: row.createdBy || row.userId,
            created_at: row.createdAt,
            updated_at: row.updatedAt
          });

          this.stats.rows.migrated++;
          console.log(`✅ Migrated row: ${row._id}`);
        } catch (error) {
          this.stats.rows.errors++;
          console.error(`❌ Error migrating row ${row._id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error in row migration:', error);
      throw error;
    }
  }

  mapColumnType(mongoType) {
    const typeMap = {
      'string': 'string',
      'number': 'number',
      'date': 'date',
      'boolean': 'boolean',
      'json': 'json',
      'text': 'string',
      'email': 'string',
      'url': 'string',
      'checkbox': 'boolean',
      'single_select': 'string',
      'multi_select': 'json',
      'formula': 'string',
      'currency': 'number',
      'percent': 'number',
      'phone': 'string',
      'time': 'string',
      'rating': 'number',
      'linked_table': 'json',
      'lookup': 'json'
    };
    return typeMap[mongoType] || 'string';
  }

  async runMigration() {
    try {
      await this.connect();
      
      console.log('🚀 Starting full migration...');
      
      await this.migrateTables();
      await this.migrateColumns();
      await this.migrateRecords();
      await this.migrateRows();
      
      console.log('🎉 Migration completed!');
      this.printStats();
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  printStats() {
    console.log('\n📊 Migration Statistics:');
    console.log('========================');
    console.log(`Tables:  ${this.stats.tables.migrated} migrated, ${this.stats.tables.errors} errors`);
    console.log(`Columns: ${this.stats.columns.migrated} migrated, ${this.stats.columns.errors} errors`);
    console.log(`Records: ${this.stats.records.migrated} migrated, ${this.stats.records.errors} errors`);
    console.log(`Rows:    ${this.stats.rows.migrated} migrated, ${this.stats.rows.errors} errors`);
    console.log('========================\n');
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      await sequelize.close();
      console.log('✅ Disconnected from databases');
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
    }
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migration = new TableMigration();
  migration.runMigration().catch(console.error);
}

export default TableMigration;
