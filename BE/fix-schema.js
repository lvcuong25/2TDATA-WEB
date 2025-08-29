import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixColumnSchema() {
    try {
        console.log('🔄 Connecting to database...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/2TDATA-P');
        console.log('✅ Connected to database');
        
        console.log('🔧 Dropping the columns collection to reset schema validation...');
        
        // Get the native MongoDB connection
        const db = mongoose.connection.db;
        
        // Drop the collection entirely to remove any schema validation
        try {
            await db.collection('columns').drop();
            console.log('✅ Dropped columns collection');
        } catch (error) {
            console.log('ℹ️ Collection may not exist yet:', error.message);
        }
        
        console.log('🔄 Recreating collection with updated schema...');
        
        // Import and recreate the Column model to establish the schema
        const { default: Column } = await import('./src/model/Column.js');
        
        console.log('✅ Column model loaded with updated schema');
        
        // Test creating a single_select column
        console.log('🧪 Testing single_select validation...');
        
        const testColumn = new Column({
            name: 'Test Single Select',
            tableId: new mongoose.Types.ObjectId(),
            databaseId: new mongoose.Types.ObjectId(), 
            userId: new mongoose.Types.ObjectId(),
            siteId: new mongoose.Types.ObjectId(),
            dataType: 'single_select',
            singleSelectConfig: {
                options: ['Option 1', 'Option 2'],
                defaultValue: 'Option 1'
            }
        });
        
        // Validate the model
        const validationError = testColumn.validateSync();
        if (validationError) {
            console.error('❌ Validation failed:', validationError);
            throw validationError;
        }
        
        console.log('✅ Schema validation successful!');
        
        // Save test document to ensure database accepts it
        await testColumn.save();
        console.log('✅ Test document saved successfully');
        
        // Clean up test document
        await Column.deleteOne({ _id: testColumn._id });
        console.log('✅ Test document cleaned up');
        
        console.log('🎉 Schema fix completed successfully!');
        
    } catch (error) {
        console.error('❌ Error fixing schema:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('📊 Database connection closed');
    }
}

console.log('🚀 Starting schema fix...');
fixColumnSchema()
    .then(() => {
        console.log('✅ Schema fix completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Schema fix failed:', error);
        process.exit(1);
    });
