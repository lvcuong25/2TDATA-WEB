import mongoose from 'mongoose';

// Connect to MongoDB
const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/2tdata';
console.log('Connecting to:', DB_URI);

try {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected to MongoDB');

  const admin = mongoose.connection.db.admin();
  
  // List all databases
  const dbs = await admin.listDatabases();
  console.log('\n📊 All databases:');
  dbs.databases.forEach(db => {
    console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
  });

  // Check if we're connected to the right database
  const currentDb = mongoose.connection.db.databaseName;
  console.log(`\n🔍 Current database: ${currentDb}`);

  // List all collections in current database
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`\n📊 Collections in ${currentDb}:`);
  if (collections.length === 0) {
    console.log('   No collections found');
  } else {
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`   - ${col.name}: ${count} documents`);
    }
  }

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}
