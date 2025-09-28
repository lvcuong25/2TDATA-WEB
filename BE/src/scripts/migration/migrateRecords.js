import mongoose from 'mongoose';
import { sequelize, Record } from '../../models/postgres/index.js';
import RecordMongo from '../../model/Record.js';
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

// Migrate Records from MongoDB to PostgreSQL
const migrateRecords = async () => {
  try {
    console.log('🚀 Starting Record migration...');
    
    // Get all records from MongoDB
    const mongoRecords = await RecordMongo.find({}).lean();
    console.log(`📊 Found ${mongoRecords.length} records in MongoDB`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const mongoRecord of mongoRecords) {
      try {
        // Check if record already exists in PostgreSQL
        const existingRecord = await Record.findOne({
          where: { id: mongoRecord._id.toString() }
        });
        
        if (existingRecord) {
          console.log(`⏭️  Record ${mongoRecord._id} already exists, skipping...`);
          continue;
        }
        
        // Create record in PostgreSQL
        await Record.create({
          id: mongoRecord._id.toString(),
          table_id: mongoRecord.tableId?.toString(),
          user_id: mongoRecord.userId?.toString(),
          site_id: mongoRecord.siteId?.toString(),
          data: mongoRecord.data || {},
          created_at: mongoRecord.createdAt,
          updated_at: mongoRecord.updatedAt
        });
        
        migratedCount++;
        if (migratedCount % 100 === 0) {
          console.log(`✅ Migrated ${migratedCount} records...`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating record ${mongoRecord._id}:`, error.message);
      }
    }
    
    console.log(`\n📈 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migratedCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);
    console.log(`📊 Total processed: ${mongoRecords.length} records`);
    
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
    await migrateRecords();
    console.log('🎉 Record migration completed successfully!');
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

export { migrateRecords, runMigration };
