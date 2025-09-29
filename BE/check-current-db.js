import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });
dotenv.config();

console.log('🔍 Checking Current Database (2TDATA-P)...');
console.log('==========================================');

async function checkCurrentDatabase() {
  try {
    // Connect to current database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2TDATA-P');
    console.log('✅ Connected to MongoDB (2TDATA-P)');

    // Get database
    const db = mongoose.connection.db;
    
    // List all collections
    console.log('📋 Listing all collections...');
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('❌ No collections found in 2TDATA-P database');
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
      console.log('   1. This database is empty, need to create sample data');
      console.log('   2. Or switch to 2TDATA database which might have data');
    } else {
      console.log('   1. This database has data, ready for migration');
      console.log('   2. Run migration with current database');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkCurrentDatabase().catch(console.error);
