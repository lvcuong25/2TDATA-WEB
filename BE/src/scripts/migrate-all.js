import mongoose from 'mongoose';
import { sequelize, Table, Column, Record, Row } from '../models/postgres/index.js';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Models
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

class FullMigration {
  constructor() {
    this.stats = {
      tables: { migrated: 0, errors: 0, skipped: 0 },
      columns: { migrated: 0, errors: 0, skipped: 0 },
      records: { migrated: 0, errors: 0, skipped: 0 },
      rows: { migrated: 0, errors: 0, skipped: 0 }
    };
    this.batchSize = 100; // Process in batches
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');

      await sequelize.authenticate();
      console.log('✅ Connected to PostgreSQL');

      await sequelize.sync({ force: false });
      console.log('✅ PostgreSQL models synchronized');
    } catch (error) {
      console.error('❌ Connection error:', error);
      throw error;
    }
  }

  async checkExistingData() {
    console.log('🔍 Checking existing PostgreSQL data...');
    
    const existingTables = await Table.count();
    const existingColumns = await Column.count();
    const existingRecords = await Record.count();
    const existingRows = await Row.count();

    console.log(`📊 Existing PostgreSQL data:`);
    console.log(`   Tables: ${existingTables}`);
    console.log(`   Columns: ${existingColumns}`);
    console.log(`   Records: ${existingRecords}`);
    console.log(`   Rows: ${existingRows}`);

    return {
      tables: existingTables,
      columns: existingColumns,
      records: existingRecords,
      rows: existingRows
    };
  }

  async migrateTables(dryRun = false) {
    console.log(`🔄 Starting table migration${dryRun ? ' (DRY RUN)' : ''}...`);
    
    try {
      const tables = await TableModel.find({}).lean();
      console.log(`📊 Found ${tables.length} tables to migrate`);

      for (let i = 0; i < tables.length; i += this.batchSize) {
        const batch = tables.slice(i, i + this.batchSize);
        console.log(`📦 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(tables.length / this.batchSize)}`);

        for (const table of batch) {
          try {
            // Check if already exists
            const existing = await Table.findByPk(table._id.toString());
            if (existing) {
              this.stats.tables.skipped++;
              continue;
            }

            if (!dryRun) {
              await Table.create({
                id: table._id.toString(),
                name: table.name || 'Unnamed Table',
                database_id: (table.baseId || table.databaseId)?.toString(),
                user_id: table.userId?.toString(),
                site_id: table.siteId?.toString(),
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
            }

            this.stats.tables.migrated++;
            console.log(`✅ ${dryRun ? '[DRY RUN] ' : ''}Migrated table: ${table.name} (${table._id})`);
          } catch (error) {
            this.stats.tables.errors++;
            console.error(`❌ Error migrating table ${table._id}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in table migration:', error);
      throw error;
    }
  }

  async migrateColumns(dryRun = false) {
    console.log(`🔄 Starting column migration${dryRun ? ' (DRY RUN)' : ''}...`);
    
    try {
      const columns = await ColumnModel.find({}).lean();
      console.log(`📊 Found ${columns.length} columns to migrate`);

      for (let i = 0; i < columns.length; i += this.batchSize) {
        const batch = columns.slice(i, i + this.batchSize);
        console.log(`📦 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(columns.length / this.batchSize)}`);

        for (const column of batch) {
          try {
            // Check if already exists
            const existing = await Column.findByPk(column._id.toString());
            if (existing) {
              this.stats.columns.skipped++;
              continue;
            }

            if (!dryRun) {
              await Column.create({
                id: column._id.toString(),
                name: column.name || 'Unnamed Column',
                key: column.key || column.name?.toLowerCase().replace(/\s+/g, '_'),
                type: this.mapColumnType(column.type),
                table_id: column.tableId?.toString(),
                user_id: column.userId?.toString(),
                site_id: column.siteId?.toString(),
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
            }

            this.stats.columns.migrated++;
            console.log(`✅ ${dryRun ? '[DRY RUN] ' : ''}Migrated column: ${column.name} (${column._id})`);
          } catch (error) {
            this.stats.columns.errors++;
            console.error(`❌ Error migrating column ${column._id}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in column migration:', error);
      throw error;
    }
  }

  async migrateRecords(dryRun = false) {
    console.log(`🔄 Starting record migration${dryRun ? ' (DRY RUN)' : ''}...`);
    
    try {
      const records = await RecordModel.find({}).lean();
      console.log(`📊 Found ${records.length} records to migrate`);

      for (let i = 0; i < records.length; i += this.batchSize) {
        const batch = records.slice(i, i + this.batchSize);
        console.log(`📦 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(records.length / this.batchSize)}`);

        for (const record of batch) {
          try {
            // Check if already exists
            const existing = await Record.findByPk(record._id.toString());
            if (existing) {
              this.stats.records.skipped++;
              continue;
            }

            if (!dryRun) {
              await Record.create({
                id: record._id.toString(),
                table_id: record.tableId?.toString(),
                user_id: record.userId?.toString(),
                site_id: record.siteId?.toString(),
                data: record.data || {},
                created_at: record.createdAt,
                updated_at: record.updatedAt
              });
            }

            this.stats.records.migrated++;
            console.log(`✅ ${dryRun ? '[DRY RUN] ' : ''}Migrated record: ${record._id}`);
          } catch (error) {
            this.stats.records.errors++;
            console.error(`❌ Error migrating record ${record._id}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in record migration:', error);
      throw error;
    }
  }

  async migrateRows(dryRun = false) {
    console.log(`🔄 Starting row migration${dryRun ? ' (DRY RUN)' : ''}...`);
    
    try {
      const rows = await RowModel.find({}).lean();
      console.log(`📊 Found ${rows.length} rows to migrate`);

      for (let i = 0; i < rows.length; i += this.batchSize) {
        const batch = rows.slice(i, i + this.batchSize);
        console.log(`📦 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(rows.length / this.batchSize)}`);

        for (const row of batch) {
          try {
            // Check if already exists
            const existing = await Row.findByPk(row._id.toString());
            if (existing) {
              this.stats.rows.skipped++;
              continue;
            }

            if (!dryRun) {
              await Row.create({
                id: row._id.toString(),
                table_id: row.tableId?.toString(),
                data: row.data || {},
                created_by: (row.createdBy || row.userId)?.toString(),
                created_at: row.createdAt,
                updated_at: row.updatedAt
              });
            }

            this.stats.rows.migrated++;
            console.log(`✅ ${dryRun ? '[DRY RUN] ' : ''}Migrated row: ${row._id}`);
          } catch (error) {
            this.stats.rows.errors++;
            console.error(`❌ Error migrating row ${row._id}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in row migration:', error);
      throw error;
    }
  }

  mapColumnType(mongoType) {
    const typeMap = {
      'text': 'string',
      'number': 'number',
      'date': 'date',
      'datetime': 'date',
      'year': 'number',
      'checkbox': 'boolean',
      'single_select': 'string',
      'multi_select': 'json',
      'formula': 'string',
      'currency': 'number',
      'percent': 'number',
      'phone': 'string',
      'time': 'string',
      'rating': 'number',
      'email': 'string',
      'url': 'string',
      'linked_table': 'json',
      'json': 'json',
      'lookup': 'json',
      // Legacy mappings
      'string': 'string',
      'boolean': 'boolean'
    };
    return typeMap[mongoType] || 'string';
  }

  async runMigration(options = {}) {
    const { dryRun = false, skipExisting = true } = options;
    
    try {
      await this.connect();
      
      console.log(`🚀 Starting full migration${dryRun ? ' (DRY RUN)' : ''}...`);
      
      await this.checkExistingData();
      
      await this.migrateTables(dryRun);
      await this.migrateColumns(dryRun);
      await this.migrateRecords(dryRun);
      await this.migrateRows(dryRun);
      
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
    console.log(`Tables:  ${this.stats.tables.migrated} migrated, ${this.stats.tables.errors} errors, ${this.stats.tables.skipped} skipped`);
    console.log(`Columns: ${this.stats.columns.migrated} migrated, ${this.stats.columns.errors} errors, ${this.stats.columns.skipped} skipped`);
    console.log(`Records: ${this.stats.records.migrated} migrated, ${this.stats.records.errors} errors, ${this.stats.records.skipped} skipped`);
    console.log(`Rows:    ${this.stats.rows.migrated} migrated, ${this.stats.rows.errors} errors, ${this.stats.rows.skipped} skipped`);
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

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Migration script started...');
  console.log('Arguments:', process.argv);
  
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipExisting = !args.includes('--force');

  console.log(`🚀 Starting migration with options:`);
  console.log(`   Dry Run: ${dryRun}`);
  console.log(`   Skip Existing: ${skipExisting}`);
  console.log('');

  const migration = new FullMigration();
  migration.runMigration({ dryRun, skipExisting }).catch(console.error);
}

export default FullMigration;
