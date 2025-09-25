import mongoose from 'mongoose';

// Test database connection like backend does
const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/2tdata';
console.log('Testing backend database connection...');
console.log('DB_URI:', DB_URI);

try {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  
  // Test collections
  const collections = await db.listCollections().toArray();
  console.log(`\n📊 Collections found: ${collections.length}`);
  
  // Test specific collections
  try {
    const bases = await db.collection('bases').find({}).toArray();
    console.log(`   - bases: ${bases.length} documents`);
  } catch (e) {
    console.log('   - bases: collection not found');
  }

  try {
    const basemembers = await db.collection('basemembers').find({}).toArray();
    console.log(`   - basemembers: ${basemembers.length} documents`);
  } catch (e) {
    console.log('   - basemembers: collection not found');
  }

  try {
    const users = await db.collection('users').find({}).toArray();
    console.log(`   - users: ${users.length} documents`);
  } catch (e) {
    console.log('   - users: collection not found');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}
