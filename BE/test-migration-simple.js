import mongoose from 'mongoose';
import { sequelize, Table, Column, Record, Row } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });
dotenv.config();

console.log('🧪 Testing Migration Setup...');
console.log('==============================');

async function testMigrationSetup() {
  try {
    // Test MongoDB connection
    console.log('🔄 Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected successfully');

    // Test PostgreSQL connection
    console.log('🔄 Testing PostgreSQL connection...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');

    // Check MongoDB data
    console.log('📊 Checking MongoDB data...');
    
    const TableModel = mongoose.model('Table', new mongoose.Schema({}, { strict: false }));
    const ColumnModel = mongoose.model('Column', new mongoose.Schema({}, { strict: false }));
    const RecordModel = mongoose.model('Record', new mongoose.Schema({}, { strict: false }));
    const RowModel = mongoose.model('Row', new mongoose.Schema({}, { strict: false }));

    const tableCount = await TableModel.countDocuments();
    const columnCount = await ColumnModel.countDocuments();
    const recordCount = await RecordModel.countDocuments();
    const rowCount = await RowModel.countDocuments();

    console.log(`📊 MongoDB Data Counts:`);
    console.log(`   Tables: ${tableCount}`);
    console.log(`   Columns: ${columnCount}`);
    console.log(`   Records: ${recordCount}`);
    console.log(`   Rows: ${rowCount}`);

    // Check PostgreSQL data
    console.log('📊 Checking PostgreSQL data...');
    
    const pgTableCount = await Table.count();
    const pgColumnCount = await Column.count();
    const pgRecordCount = await Record.count();
    const pgRowCount = await Row.count();

    console.log(`📊 PostgreSQL Data Counts:`);
    console.log(`   Tables: ${pgTableCount}`);
    console.log(`   Columns: ${pgColumnCount}`);
    console.log(`   Records: ${pgRecordCount}`);
    console.log(`   Rows: ${pgRowCount}`);

    // Test sample data migration (dry run)
    if (tableCount > 0) {
      console.log('🔄 Testing sample table migration (dry run)...');
      
      const sampleTable = await TableModel.findOne().lean();
      console.log(`📋 Sample Table: ${sampleTable?.name || 'N/A'} (${sampleTable?._id})`);
      
      // Check if already exists in PostgreSQL
      const existingTable = await Table.findByPk(sampleTable._id.toString());
      if (existingTable) {
        console.log('✅ Table already exists in PostgreSQL');
      } else {
        console.log('⏳ Table would be migrated to PostgreSQL');
      }
    }

    console.log('🎉 Migration setup test completed successfully!');
    console.log('✅ Ready for full migration');

  } catch (error) {
    console.error('❌ Migration setup test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
  }
}

testMigrationSetup().catch(console.error);
