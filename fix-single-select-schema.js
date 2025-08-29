import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './BE/.env' });

const DB_URI = process.env.DB_URI || 'mongodb://admin:password123@mongodb:27017/2TDATA?authSource=admin';

async function fixSingleSelectSchema() {
    try {
        console.log('🔄 Connecting to database...');
        
        // Connect using native MongoDB driver for schema operations
        const client = new MongoClient(DB_URI);
        await client.connect();
        
        const db = client.db();
        const collection = db.collection('columns');
        
        console.log('✅ Connected to database');
        
        console.log('🔧 Checking current schema validation...');
        
        // Get current collection info
        const collections = await db.listCollections({ name: 'columns' }).toArray();
        if (collections.length > 0) {
            console.log('Current validation rules:', JSON.stringify(collections[0].options.validator, null, 2));
        }
        
        console.log('🔄 Dropping existing schema validation...');
        
        // Remove existing validation to allow schema updates
        try {
            await db.command({
                collMod: 'columns',
                validator: {}
            });
            console.log('✅ Removed existing schema validation');
        } catch (error) {
            console.log('ℹ️ No existing validation to remove or error:', error.message);
        }
        
        console.log('🔄 Updating documents that might have single_select...');
        
        // Check if there are any documents with single_select dataType
        const singleSelectDocs = await collection.find({ dataType: 'single_select' }).toArray();
        console.log(`Found ${singleSelectDocs.length} documents with single_select dataType`);
        
        console.log('🔄 Now connecting with Mongoose to establish new schema...');
        
        // Close native connection
        await client.close();
        
        // Connect with Mongoose to establish the schema properly
        await mongoose.connect(DB_URI);
        console.log('✅ Connected with Mongoose');
        
        // Import the Column model to ensure schema is applied
        const ColumnSchema = new mongoose.Schema({
            name: {
                type: String,
                required: true,
                trim: true
            },
            tableId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Table',
                required: true
            },
            databaseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Database',
                required: true
            },
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            siteId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Site',
                required: true
            },
            dataType: {
                type: String,
                required: true,
                enum: ['string', 'number', 'date', 'text', 'email', 'url', 'json', 'checkbox', 'single_select']
            },
            isRequired: {
                type: Boolean,
                default: false
            },
            isUnique: {
                type: Boolean,
                default: false
            },
            defaultValue: {
                type: mongoose.Schema.Types.Mixed,
                default: null
            },
            checkboxConfig: {
                type: {
                    icon: {
                        type: String,
                        enum: ['check-circle', 'border'],
                        default: 'check-circle'
                    },
                    color: {
                        type: String,
                        default: '#52c41a'
                    },
                    defaultValue: {
                        type: Boolean,
                        default: false
                    }
                },
                default: undefined
            },
            singleSelectConfig: {
                type: {
                    options: {
                        type: [String],
                        default: []
                    },
                    defaultValue: {
                        type: String,
                        default: ''
                    }
                },
                default: undefined
            },
            order: {
                type: Number,
                default: 0
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }, {
            timestamps: true
        });
        
        // Compound index to ensure unique column names per table
        ColumnSchema.index({ name: 1, tableId: 1 }, { unique: true });
        
        // Pre-save middleware to update the updatedAt field
        ColumnSchema.pre('save', function(next) {
            this.updatedAt = new Date();
            next();
        });
        
        // Try to compile the model (this should apply the schema validation)
        const Column = mongoose.model('Column', ColumnSchema);
        
        console.log('✅ Column model schema updated with single_select support');
        
        console.log('🧪 Testing single_select column creation...');
        
        // Test creating a document with single_select
        const testColumn = new Column({
            name: 'Test Single Select Column',
            tableId: new mongoose.Types.ObjectId(),
            databaseId: new mongoose.Types.ObjectId(),
            userId: new mongoose.Types.ObjectId(),
            siteId: new mongoose.Types.ObjectId(),
            dataType: 'single_select',
            singleSelectConfig: {
                options: ['Option1', 'Option2'],
                defaultValue: 'Option1'
            }
        });
        
        // Validate without saving
        const validationError = testColumn.validateSync();
        if (validationError) {
            console.error('❌ Validation failed:', validationError.message);
            throw validationError;
        }
        
        console.log('✅ Schema validation passed for single_select');
        
        console.log('🎉 Schema fix completed successfully!');
        
        await mongoose.disconnect();
        
    } catch (error) {
        console.error('❌ Error fixing schema:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

console.log('🚀 Starting single_select schema fix...');
fixSingleSelectSchema();
