import mongoose from 'mongoose';

// Connect to MongoDB with uppercase database name
const DB_URI = 'mongodb://localhost:27017/2TDATA';
console.log('Connecting to:', DB_URI);

try {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  
  // Check databases collection
  console.log('\n🔍 Checking databases collection:');
  const databases = await db.collection('databases').find({}).toArray();
  console.log(`   - databases: ${databases.length} documents`);
  
  if (databases.length > 0) {
    databases.forEach(db => {
      console.log(`     * ${db.name} (${db._id})`);
      console.log(`       - Owner: ${db.ownerId}`);
      console.log(`       - Org: ${db.orgId}`);
      console.log(`       - Created: ${db.createdAt}`);
    });
  }

  // Check if there are any basemembers
  console.log('\n🔍 Checking for basemembers:');
  try {
    const basemembers = await db.collection('basemembers').find({}).toArray();
    console.log(`   - basemembers: ${basemembers.length} documents`);
  } catch (e) {
    console.log('   - basemembers: collection not found');
  }

  // Check organizations
  console.log('\n🔍 Checking organizations:');
  const organizations = await db.collection('organizations').find({}).toArray();
  console.log(`   - organizations: ${organizations.length} documents`);
  
  if (organizations.length > 0) {
    organizations.forEach(org => {
      console.log(`     * ${org.name} (${org._id})`);
      console.log(`       - Members: ${org.members?.length || 0}`);
      if (org.members && org.members.length > 0) {
        org.members.forEach(member => {
          console.log(`         - User: ${member.user} (${member.role})`);
        });
      }
    });
  }

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}
