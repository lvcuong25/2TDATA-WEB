import { migrateTables } from './migrateTables.js';
import { migrateColumns } from './migrateColumns.js';
import { migrateRecords } from './migrateRecords.js';
import { migrateRows } from './migrateRows.js';
import mongoose from 'mongoose';
import { sequelize } from '../../models/postgres/index.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to both databases
const connectDatabases = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ Connected to MongoDB');
    
    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

// Run complete migration
const runCompleteMigration = async () => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting complete migration from MongoDB to PostgreSQL...\n');
    
    await connectDatabases();
    
    // Run migrations in order (due to foreign key constraints)
    console.log('📋 Step 1: Migrating Tables...');
    await migrateTables();
    
    console.log('\n📋 Step 2: Migrating Columns...');
    await migrateColumns();
    
    console.log('\n📋 Step 3: Migrating Records...');
    await migrateRecords();
    
    console.log('\n📋 Step 4: Migrating Rows...');
    await migrateRows();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n🎉 Complete migration finished successfully!');
    console.log(`⏱️  Total time: ${duration.toFixed(2)} seconds`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
    process.exit(0);
  }
};

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteMigration();
}

export { runCompleteMigration };
