import mongoose from 'mongoose';

// Connect to MongoDB with uppercase database name
const DB_URI = 'mongodb://localhost:27017/2TDATA';
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
    if (bases.length > 0) {
      bases.forEach(base => {
        console.log(`     * ${base.name} (${base._id}) - Owner: ${base.ownerId}`);
      });
    }
  } catch (e) {
    console.log('   - bases: collection not found');
  }

  try {
    const databases = await db.collection('databases').find({}).toArray();
    console.log(`   - databases: ${databases.length} documents`);
    if (databases.length > 0) {
      databases.forEach(db => {
        console.log(`     * ${db.name} (${db._id}) - Owner: ${db.ownerId}`);
      });
    }
  } catch (e) {
    console.log('   - databases: collection not found');
  }

  try {
    const basemembers = await db.collection('basemembers').find({}).toArray();
    console.log(`   - basemembers: ${basemembers.length} documents`);
    if (basemembers.length > 0) {
      basemembers.forEach(member => {
        console.log(`     * Base: ${member.baseId} - User: ${member.userId} - Role: ${member.role}`);
      });
    }
  } catch (e) {
    console.log('   - basemembers: collection not found');
  }

  try {
    const users = await db.collection('users').find({}).toArray();
    console.log(`   - users: ${users.length} documents`);
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`     * ${user.name} (${user._id}) - Email: ${user.email}`);
      });
    }
  } catch (e) {
    console.log('   - users: collection not found');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}
