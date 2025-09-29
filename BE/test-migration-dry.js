import mongoose from 'mongoose';
import { sequelize, Table, Column, Record, Row } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });
dotenv.config();

console.log('🧪 Testing Migration Dry Run...');
console.log('================================');

async function testMigrationDryRun() {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2TDATA-P');
    console.log('✅ MongoDB connected successfully');

    // Connect to PostgreSQL
    console.log('🔄 Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');

    // Create MongoDB models
    const TableModel = mongoose.model('Table', new mongoose.Schema({}, { strict: false }));
    const ColumnModel = mongoose.model('Column', new mongoose.Schema({}, { strict: false }));
    const RecordModel = mongoose.model('Record', new mongoose.Schema({}, { strict: false }));
    const RowModel = mongoose.model('Row', new mongoose.Schema({}, { strict: false }));

    // Test Tables Migration (Dry Run)
    console.log('🔄 Testing Tables Migration (Dry Run)...');
    const tables = await TableModel.find({}).lean();
    console.log(`📊 Found ${tables.length} tables to migrate`);

    let tablesProcessed = 0;
    let tablesSkipped = 0;
    let tablesErrors = 0;

    for (const table of tables.slice(0, 3)) { // Test first 3 tables only
      try {
        // Check if already exists in PostgreSQL
        const existing = await Table.findByPk(table._id.toString());
        if (existing) {
          tablesSkipped++;
          console.log(`⏭️ [DRY RUN] Table already exists: ${table.name} (${table._id})`);
        } else {
          tablesProcessed++;
          console.log(`✅ [DRY RUN] Would migrate table: ${table.name} (${table._id})`);
        }
      } catch (error) {
        tablesErrors++;
        console.error(`❌ [DRY RUN] Error with table ${table._id}:`, error.message);
      }
    }

    // Test Columns Migration (Dry Run)
    console.log('🔄 Testing Columns Migration (Dry Run)...');
    const columns = await ColumnModel.find({}).lean();
    console.log(`📊 Found ${columns.length} columns to migrate`);

    let columnsProcessed = 0;
    let columnsSkipped = 0;
    let columnsErrors = 0;

    for (const column of columns.slice(0, 3)) { // Test first 3 columns only
      try {
        // Check if already exists in PostgreSQL
        const existing = await Column.findByPk(column._id.toString());
        if (existing) {
          columnsSkipped++;
          console.log(`⏭️ [DRY RUN] Column already exists: ${column.name} (${column._id})`);
        } else {
          columnsProcessed++;
          console.log(`✅ [DRY RUN] Would migrate column: ${column.name} (${column._id})`);
        }
      } catch (error) {
        columnsErrors++;
        console.error(`❌ [DRY RUN] Error with column ${column._id}:`, error.message);
      }
    }

    // Test Records Migration (Dry Run)
    console.log('🔄 Testing Records Migration (Dry Run)...');
    const records = await RecordModel.find({}).lean();
    console.log(`📊 Found ${records.length} records to migrate`);

    let recordsProcessed = 0;
    let recordsSkipped = 0;
    let recordsErrors = 0;

    for (const record of records.slice(0, 3)) { // Test first 3 records only
      try {
        // Check if already exists in PostgreSQL
        const existing = await Record.findByPk(record._id.toString());
        if (existing) {
          recordsSkipped++;
          console.log(`⏭️ [DRY RUN] Record already exists: ${record._id}`);
        } else {
          recordsProcessed++;
          console.log(`✅ [DRY RUN] Would migrate record: ${record._id}`);
        }
      } catch (error) {
        recordsErrors++;
        console.error(`❌ [DRY RUN] Error with record ${record._id}:`, error.message);
      }
    }

    // Summary
    console.log('\n📊 Dry Run Summary:');
    console.log('===================');
    console.log(`Tables:  ${tablesProcessed} would migrate, ${tablesSkipped} skipped, ${tablesErrors} errors`);
    console.log(`Columns: ${columnsProcessed} would migrate, ${columnsSkipped} skipped, ${columnsErrors} errors`);
    console.log(`Records: ${recordsProcessed} would migrate, ${recordsSkipped} skipped, ${recordsErrors} errors`);
    
    if (tablesErrors === 0 && columnsErrors === 0 && recordsErrors === 0) {
      console.log('\n🎉 Dry run completed successfully!');
      console.log('✅ Ready for full migration');
    } else {
      console.log('\n⚠️ Dry run completed with errors');
      console.log('❌ Please fix errors before running full migration');
    }

  } catch (error) {
    console.error('❌ Dry run failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
  }
}

testMigrationDryRun().catch(console.error);
