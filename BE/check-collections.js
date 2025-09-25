import mongoose from 'mongoose';

// Connect to MongoDB
mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/2tdata');

async function checkCollections() {
  try {
    console.log('🔍 Checking all collections...\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`📊 Found ${collections.length} collections:`);
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   - ${collection.name}: ${count} documents`);
    }

    // Check specific collections
    console.log('\n🔍 Checking specific collections:');
    
    const bases = await db.collection('bases').find({}).toArray();
    console.log(`   - bases: ${bases.length} documents`);
    if (bases.length > 0) {
      bases.forEach(base => {
        console.log(`     * ${base.name} (${base._id}) - Owner: ${base.ownerId}`);
      });
    }

    const databases = await db.collection('databases').find({}).toArray();
    console.log(`   - databases: ${databases.length} documents`);
    if (databases.length > 0) {
      databases.forEach(db => {
        console.log(`     * ${db.name} (${db._id}) - Owner: ${db.ownerId}`);
      });
    }

    const basemembers = await db.collection('basemembers').find({}).toArray();
    console.log(`   - basemembers: ${basemembers.length} documents`);
    if (basemembers.length > 0) {
      basemembers.forEach(member => {
        console.log(`     * Base: ${member.baseId} - User: ${member.userId} - Role: ${member.role}`);
      });
    }

    const users = await db.collection('users').find({}).toArray();
    console.log(`   - users: ${users.length} documents`);
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`     * ${user.name} (${user._id}) - Email: ${user.email}`);
      });
    }

    console.log('\n✅ Collection check completed!');
  } catch (error) {
    console.error('❌ Error checking collections:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkCollections();