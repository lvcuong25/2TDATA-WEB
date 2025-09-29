import mongoose from 'mongoose';
import { sequelize, Table } from '../../models/postgres/index.js';
import TableMongo from '../../model/Table.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Connect to PostgreSQL
const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error);
    throw error;
  }
};

// Migrate Tables from MongoDB to PostgreSQL
const migrateTables = async () => {
  try {
    console.log('🚀 Starting Table migration...');
    
    // Get all tables from MongoDB
    const mongoTables = await TableMongo.find({}).lean();
    console.log(`📊 Found ${mongoTables.length} tables in MongoDB`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const mongoTable of mongoTables) {
      try {
        // Check if table already exists in PostgreSQL
        const existingTable = await Table.findOne({
          where: { id: mongoTable._id.toString() }
        });
        
        if (existingTable) {
          console.log(`⏭️  Table ${mongoTable.name} already exists, skipping...`);
          continue;
        }
        
        // Create table in PostgreSQL
        await Table.create({
          id: mongoTable._id.toString(),
          name: mongoTable.name,
          database_id: mongoTable.databaseId?.toString(),
          user_id: mongoTable.userId?.toString(),
          site_id: mongoTable.siteId?.toString(),
          table_access_rule: mongoTable.tableAccessRule || {
            userIds: [],
            allUsers: false,
            access: []
          },
          column_access_rules: mongoTable.columnAccessRules || [],
          record_access_rules: mongoTable.recordAccessRules || [],
          cell_access_rules: mongoTable.cellAccessRules || [],
          description: mongoTable.description || '',
          created_at: mongoTable.createdAt,
          updated_at: mongoTable.updatedAt
        });
        
        migratedCount++;
        console.log(`✅ Migrated table: ${mongoTable.name}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating table ${mongoTable.name}:`, error.message);
      }
    }
    
    console.log(`\n📈 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migratedCount} tables`);
    console.log(`❌ Errors: ${errorCount} tables`);
    console.log(`📊 Total processed: ${mongoTables.length} tables`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Main migration function
const runMigration = async () => {
  try {
    await connectMongoDB();
    await connectPostgreSQL();
    await migrateTables();
    console.log('🎉 Table migration completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
    process.exit(0);
  }
};

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { migrateTables, runMigration };
