import mongoose from 'mongoose';
import { sequelize, Table, Column, Record, Row } from '../models/postgres/index.js';
import dotenv from 'dotenv';

dotenv.config();

class MigrationRollback {
  constructor() {
    this.stats = {
      tables: { removed: 0, errors: 0 },
      columns: { removed: 0, errors: 0 },
      records: { removed: 0, errors: 0 },
      rows: { removed: 0, errors: 0 }
    };
    this.backupCreated = false;
  }

  async connect() {
    try {
      // Connect to PostgreSQL (source of rollback)
      await sequelize.authenticate();
      console.log('✅ Connected to PostgreSQL');

      // Connect to MongoDB (destination of rollback)
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ Connection error:', error);
      throw error;
    }
  }

  async createBackup() {
    console.log('💾 Creating backup before rollback...');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = `./backups/rollback-backup-${timestamp}`;
      
      // Create backup directory
      const fs = await import('fs');
      if (!fs.existsSync('./backups')) {
        fs.mkdirSync('./backups', { recursive: true });
      }
      fs.mkdirSync(backupDir, { recursive: true });

      // Export PostgreSQL data
      const tables = await Table.findAll();
      const columns = await Column.findAll();
      const records = await Record.findAll();
      const rows = await Row.findAll();

      fs.writeFileSync(`${backupDir}/postgres-tables.json`, JSON.stringify(tables, null, 2));
      fs.writeFileSync(`${backupDir}/postgres-columns.json`, JSON.stringify(columns, null, 2));
      fs.writeFileSync(`${backupDir}/postgres-records.json`, JSON.stringify(records, null, 2));
      fs.writeFileSync(`${backupDir}/postgres-rows.json`, JSON.stringify(rows, null, 2));

      console.log(`✅ Backup created at: ${backupDir}`);
      this.backupCreated = true;
      return backupDir;
    } catch (error) {
      console.error('❌ Error creating backup:', error);
      throw error;
    }
  }

  async rollbackTables() {
    console.log('🔄 Rolling back tables...');
    
    try {
      const tables = await Table.findAll();
      console.log(`📊 Found ${tables.length} tables to rollback`);

      for (const table of tables) {
        try {
          // Check if table exists in MongoDB
          const existingTable = await mongoose.model('Table').findById(table.id);
          
          if (existingTable) {
            // Update existing table
            await mongoose.model('Table').findByIdAndUpdate(table.id, {
              name: table.name,
              baseId: table.database_id,
              userId: table.user_id,
              siteId: table.site_id,
              tableAccessRule: table.table_access_rule,
              columnAccessRules: table.column_access_rules,
              recordAccessRules: table.record_access_rules,
              cellAccessRules: table.cell_access_rules,
              description: table.description,
              updatedAt: new Date()
            });
            console.log(`✅ Updated table: ${table.name} (${table.id})`);
          } else {
            // Create new table in MongoDB
            await mongoose.model('Table').create({
              _id: table.id,
              name: table.name,
              baseId: table.database_id,
              userId: table.user_id,
              siteId: table.site_id,
              tableAccessRule: table.table_access_rule,
              columnAccessRules: table.column_access_rules,
              recordAccessRules: table.record_access_rules,
              cellAccessRules: table.cell_access_rules,
              description: table.description,
              createdAt: table.created_at,
              updatedAt: table.updated_at
            });
            console.log(`✅ Created table: ${table.name} (${table.id})`);
          }

          this.stats.tables.removed++;
        } catch (error) {
          this.stats.tables.errors++;
          console.error(`❌ Error rolling back table ${table.id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error in table rollback:', error);
      throw error;
    }
  }

  async rollbackColumns() {
    console.log('🔄 Rolling back columns...');
    
    try {
      const columns = await Column.findAll();
      console.log(`📊 Found ${columns.length} columns to rollback`);

      for (const column of columns) {
        try {
          // Check if column exists in MongoDB
          const existingColumn = await mongoose.model('Column').findById(column.id);
          
          if (existingColumn) {
            // Update existing column
            await mongoose.model('Column').findByIdAndUpdate(column.id, {
              name: column.name,
              key: column.key,
              type: column.type,
              tableId: column.table_id,
              userId: column.user_id,
              siteId: column.site_id,
              dataType: column.data_type,
              isRequired: column.is_required,
              isUnique: column.is_unique,
              defaultValue: column.default_value,
              checkboxConfig: column.checkbox_config,
              singleSelectConfig: column.single_select_config,
              multiSelectConfig: column.multi_select_config,
              formulaConfig: column.formula_config,
              dateConfig: column.date_config,
              currencyConfig: column.currency_config,
              percentConfig: column.percent_config,
              urlConfig: column.url_config,
              phoneConfig: column.phone_config,
              timeConfig: column.time_config,
              ratingConfig: column.rating_config,
              linkedTableConfig: column.linked_table_config,
              lookupConfig: column.lookup_config,
              order: column.order,
              updatedAt: new Date()
            });
            console.log(`✅ Updated column: ${column.name} (${column.id})`);
          } else {
            // Create new column in MongoDB
            await mongoose.model('Column').create({
              _id: column.id,
              name: column.name,
              key: column.key,
              type: column.type,
              tableId: column.table_id,
              userId: column.user_id,
              siteId: column.site_id,
              dataType: column.data_type,
              isRequired: column.is_required,
              isUnique: column.is_unique,
              defaultValue: column.default_value,
              checkboxConfig: column.checkbox_config,
              singleSelectConfig: column.single_select_config,
              multiSelectConfig: column.multi_select_config,
              formulaConfig: column.formula_config,
              dateConfig: column.date_config,
              currencyConfig: column.currency_config,
              percentConfig: column.percent_config,
              urlConfig: column.url_config,
              phoneConfig: column.phone_config,
              timeConfig: column.time_config,
              ratingConfig: column.rating_config,
              linkedTableConfig: column.linked_table_config,
              lookupConfig: column.lookup_config,
              order: column.order,
              createdAt: column.created_at,
              updatedAt: column.updated_at
            });
            console.log(`✅ Created column: ${column.name} (${column.id})`);
          }

          this.stats.columns.removed++;
        } catch (error) {
          this.stats.columns.errors++;
          console.error(`❌ Error rolling back column ${column.id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error in column rollback:', error);
      throw error;
    }
  }

  async rollbackRecords() {
    console.log('🔄 Rolling back records...');
    
    try {
      const records = await Record.findAll();
      console.log(`📊 Found ${records.length} records to rollback`);

      for (const record of records) {
        try {
          // Check if record exists in MongoDB
          const existingRecord = await mongoose.model('Record').findById(record.id);
          
          if (existingRecord) {
            // Update existing record
            await mongoose.model('Record').findByIdAndUpdate(record.id, {
              tableId: record.table_id,
              userId: record.user_id,
              siteId: record.site_id,
              data: record.data,
              updatedAt: new Date()
            });
            console.log(`✅ Updated record: ${record.id}`);
          } else {
            // Create new record in MongoDB
            await mongoose.model('Record').create({
              _id: record.id,
              tableId: record.table_id,
              userId: record.user_id,
              siteId: record.site_id,
              data: record.data,
              createdAt: record.created_at,
              updatedAt: record.updated_at
            });
            console.log(`✅ Created record: ${record.id}`);
          }

          this.stats.records.removed++;
        } catch (error) {
          this.stats.records.errors++;
          console.error(`❌ Error rolling back record ${record.id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error in record rollback:', error);
      throw error;
    }
  }

  async rollbackRows() {
    console.log('🔄 Rolling back rows...');
    
    try {
      const rows = await Row.findAll();
      console.log(`📊 Found ${rows.length} rows to rollback`);

      for (const row of rows) {
        try {
          // Check if row exists in MongoDB
          const existingRow = await mongoose.model('Row').findById(row.id);
          
          if (existingRow) {
            // Update existing row
            await mongoose.model('Row').findByIdAndUpdate(row.id, {
              tableId: row.table_id,
              data: row.data,
              createdBy: row.created_by,
              updatedAt: new Date()
            });
            console.log(`✅ Updated row: ${row.id}`);
          } else {
            // Create new row in MongoDB
            await mongoose.model('Row').create({
              _id: row.id,
              tableId: row.table_id,
              data: row.data,
              createdBy: row.created_by,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            });
            console.log(`✅ Created row: ${row.id}`);
          }

          this.stats.rows.removed++;
        } catch (error) {
          this.stats.rows.errors++;
          console.error(`❌ Error rolling back row ${row.id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error in row rollback:', error);
      throw error;
    }
  }

  async clearPostgreSQL() {
    console.log('🗑️ Clearing PostgreSQL data...');
    
    try {
      await Row.destroy({ where: {} });
      await Record.destroy({ where: {} });
      await Column.destroy({ where: {} });
      await Table.destroy({ where: {} });
      
      console.log('✅ PostgreSQL data cleared');
    } catch (error) {
      console.error('❌ Error clearing PostgreSQL:', error);
      throw error;
    }
  }

  async runRollback(options = {}) {
    const { createBackup = true, clearPostgres = true } = options;
    
    try {
      await this.connect();
      
      if (createBackup) {
        await this.createBackup();
      }
      
      console.log('🔄 Starting rollback process...');
      
      await this.rollbackTables();
      await this.rollbackColumns();
      await this.rollbackRecords();
      await this.rollbackRows();
      
      if (clearPostgres) {
        await this.clearPostgreSQL();
      }
      
      console.log('🎉 Rollback completed!');
      this.printStats();
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  printStats() {
    console.log('\n📊 Rollback Statistics:');
    console.log('========================');
    console.log(`Tables:  ${this.stats.tables.removed} processed, ${this.stats.tables.errors} errors`);
    console.log(`Columns: ${this.stats.columns.removed} processed, ${this.stats.columns.errors} errors`);
    console.log(`Records: ${this.stats.records.removed} processed, ${this.stats.records.errors} errors`);
    console.log(`Rows:    ${this.stats.rows.removed} processed, ${this.stats.rows.errors} errors`);
    console.log(`Backup Created: ${this.backupCreated ? '✅' : '❌'}`);
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
  const args = process.argv.slice(2);
  const createBackup = !args.includes('--no-backup');
  const clearPostgres = !args.includes('--keep-postgres');

  console.log(`🔄 Starting rollback with options:`);
  console.log(`   Create Backup: ${createBackup}`);
  console.log(`   Clear PostgreSQL: ${clearPostgres}`);
  console.log('');

  const rollback = new MigrationRollback();
  rollback.runRollback({ createBackup, clearPostgres }).catch(console.error);
}

export default MigrationRollback;
