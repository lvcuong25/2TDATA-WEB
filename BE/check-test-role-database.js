import mongoose from 'mongoose';

// Connect to MongoDB with 2TDATA-P database
const DB_URI = 'mongodb://localhost:27017/2TDATA-P';
console.log('Connecting to:', DB_URI);

try {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  
  // Check the specific database from the image
  const databaseId = '68d4068c5a40b576555afbf8'; // Test Role database ID from image
  console.log(`\n🔍 Checking database: ${databaseId}`);
  
  // Check if this database exists in bases collection
  const base = await db.collection('bases').findOne({ _id: new mongoose.Types.ObjectId(databaseId) });
  if (base) {
    console.log('✅ Base found:');
    console.log(`   - Name: ${base.name}`);
    console.log(`   - Owner: ${base.ownerId}`);
    console.log(`   - Org: ${base.orgId}`);
    console.log(`   - Created: ${base.createdAt}`);
  } else {
    console.log('❌ Base not found in bases collection');
  }
  
  // Check if this database exists in databases collection
  const database = await db.collection('databases').findOne({ _id: new mongoose.Types.ObjectId(databaseId) });
  if (database) {
    console.log('✅ Database found:');
    console.log(`   - Name: ${database.name}`);
    console.log(`   - Owner: ${database.ownerId}`);
    console.log(`   - Org: ${database.orgId}`);
    console.log(`   - Created: ${database.createdAt}`);
  } else {
    console.log('❌ Database not found in databases collection');
  }
  
  // Check BaseMembers for this database
  const baseMembers = await db.collection('basemembers').find({ baseId: new mongoose.Types.ObjectId(databaseId) }).toArray();
  console.log(`\n👥 BaseMembers for ${databaseId}: ${baseMembers.length}`);
  baseMembers.forEach(member => {
    console.log(`   - User: ${member.userId} - Role: ${member.role}`);
  });
  
  // Check user trunglq8.93@gmail.com
  const user = await db.collection('users').findOne({ email: 'trunglq8.93@gmail.com' });
  if (user) {
    console.log(`\n👤 User found: ${user.name} (${user._id})`);
    
    // Check if this user is a member of the database
    const userMember = await db.collection('basemembers').findOne({ 
      baseId: new mongoose.Types.ObjectId(databaseId), 
      userId: user._id 
    });
    
    if (userMember) {
      console.log(`✅ User is member with role: ${userMember.role}`);
    } else {
      console.log(`❌ User is NOT a member of this database`);
    }
  } else {
    console.log('❌ User not found');
  }
  
  // List all bases for comparison
  console.log('\n📊 All bases in database:');
  const allBases = await db.collection('bases').find({}).toArray();
  allBases.forEach(base => {
    console.log(`   - ${base.name} (${base._id}) - Owner: ${base.ownerId}`);
  });

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}
