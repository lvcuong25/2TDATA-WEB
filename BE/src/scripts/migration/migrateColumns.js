import mongoose from 'mongoose';
import { sequelize, Column } from '../../models/postgres/index.js';
import ColumnMongo from '../../model/Column.js';
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

// Migrate Columns from MongoDB to PostgreSQL
const migrateColumns = async () => {
  try {
    console.log('🚀 Starting Column migration...');
    
    // Get all columns from MongoDB
    const mongoColumns = await ColumnMongo.find({}).lean();
    console.log(`📊 Found ${mongoColumns.length} columns in MongoDB`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const mongoColumn of mongoColumns) {
      try {
        // Check if column already exists in PostgreSQL
        const existingColumn = await Column.findOne({
          where: { id: mongoColumn._id.toString() }
        });
        
        if (existingColumn) {
          console.log(`⏭️  Column ${mongoColumn.name} already exists, skipping...`);
          continue;
        }
        
        // Create column in PostgreSQL
        await Column.create({
          id: mongoColumn._id.toString(),
          name: mongoColumn.name,
          key: mongoColumn.key,
          type: mongoColumn.type,
          table_id: mongoColumn.tableId?.toString(),
          user_id: mongoColumn.userId?.toString(),
          site_id: mongoColumn.siteId?.toString(),
          data_type: mongoColumn.dataType,
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
          order: mongoColumn.order || 0,
          created_at: mongoColumn.createdAt,
          updated_at: mongoColumn.updatedAt
        });
        
        migratedCount++;
        console.log(`✅ Migrated column: ${mongoColumn.name}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating column ${mongoColumn.name}:`, error.message);
      }
    }
    
    console.log(`\n📈 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migratedCount} columns`);
    console.log(`❌ Errors: ${errorCount} columns`);
    console.log(`📊 Total processed: ${mongoColumns.length} columns`);
    
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
    await migrateColumns();
    console.log('🎉 Column migration completed successfully!');
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

export { migrateColumns, runMigration };
