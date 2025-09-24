import mongoose from 'mongoose';

// Connect to MongoDB
const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/2tdata';
console.log('Connecting to:', DB_URI);

try {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  
  // List all collections
  const collections = await db.listCollections().toArray();
  console.log('\n📊 Collections:');
  collections.forEach(col => {
    console.log(`   - ${col.name}`);
  });

  // Check specific collections
  console.log('\n🔍 Checking specific collections:');
  
  try {
    const bases = await db.collection('bases').find({}).toArray();
    console.log(`   - bases: ${bases.length} documents`);
  } catch (e) {
    console.log('   - bases: collection not found');
  }

  try {
    const databases = await db.collection('databases').find({}).toArray();
    console.log(`   - databases: ${databases.length} documents`);
  } catch (e) {
    console.log('   - databases: collection not found');
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
