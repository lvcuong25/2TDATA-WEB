import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });
dotenv.config();

console.log('🔍 Checking MongoDB Collections...');
console.log('===================================');

async function checkMongoDBCollections() {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected successfully');

    // Get database
    const db = mongoose.connection.db;
    
    // List all collections
    console.log('📋 Listing all collections...');
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('❌ No collections found in database');
      console.log('💡 This means your MongoDB database is empty');
      console.log('💡 You need to have some data in MongoDB before running migration');
    } else {
      console.log(`📊 Found ${collections.length} collections:`);
      
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`   ${collection.name}: ${count} documents`);
      }
    }

    // Check specific collections that we expect
    const expectedCollections = ['tables', 'columns', 'records', 'rows', 'bases', 'users', 'sites'];
    
    console.log('\n🔍 Checking expected collections...');
    for (const collectionName of expectedCollections) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`   ${collectionName}: ${count} documents`);
      } catch (error) {
        console.log(`   ${collectionName}: Collection does not exist`);
      }
    }

    console.log('\n💡 Recommendations:');
    if (collections.length === 0) {
      console.log('   1. Start your application to create some data');
      console.log('   2. Or import some sample data');
      console.log('   3. Then run migration again');
    } else {
      console.log('   1. Your MongoDB has data, migration should work');
      console.log('   2. Run migration again');
    }

  } catch (error) {
    console.error('❌ Error checking MongoDB collections:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkMongoDBCollections().catch(console.error);
