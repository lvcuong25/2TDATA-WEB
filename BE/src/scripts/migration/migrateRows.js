import mongoose from 'mongoose';
import { sequelize, Row } from '../../models/postgres/index.js';
import RowMongo from '../../model/Row.js';
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

// Migrate Rows from MongoDB to PostgreSQL
const migrateRows = async () => {
  try {
    console.log('🚀 Starting Row migration...');
    
    // Get all rows from MongoDB
    const mongoRows = await RowMongo.find({}).lean();
    console.log(`📊 Found ${mongoRows.length} rows in MongoDB`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const mongoRow of mongoRows) {
      try {
        // Check if row already exists in PostgreSQL
        const existingRow = await Row.findOne({
          where: { id: mongoRow._id.toString() }
        });
        
        if (existingRow) {
          console.log(`⏭️  Row ${mongoRow._id} already exists, skipping...`);
          continue;
        }
        
        // Create row in PostgreSQL
        await Row.create({
          id: mongoRow._id.toString(),
          table_id: mongoRow.tableId?.toString(),
          data: mongoRow.data || {},
          created_by: mongoRow.createdBy?.toString(),
          created_at: mongoRow.createdAt,
          updated_at: mongoRow.updatedAt
        });
        
        migratedCount++;
        if (migratedCount % 100 === 0) {
          console.log(`✅ Migrated ${migratedCount} rows...`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating row ${mongoRow._id}:`, error.message);
      }
    }
    
    console.log(`\n📈 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migratedCount} rows`);
    console.log(`❌ Errors: ${errorCount} rows`);
    console.log(`📊 Total processed: ${mongoRows.length} rows`);
    
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
    await migrateRows();
    console.log('🎉 Row migration completed successfully!');
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

export { migrateRows, runMigration };
