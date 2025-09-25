import mongoose from 'mongoose';

// Connect to MongoDB with 2TDATA-P database
const DB_URI = 'mongodb://localhost:27017/2TDATA-P';
console.log('Connecting to:', DB_URI);

try {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  
  console.log('\n🔍 Checking and fixing BaseMember records...\n');

  // Get all bases
  const bases = await db.collection('bases').find({}).toArray();
  console.log(`📊 Found ${bases.length} bases`);

  for (const base of bases) {
    console.log(`\n📁 Base: ${base.name} (${base._id})`);
    console.log(`   Owner ID: ${base.ownerId}`);

    // Check if owner is in BaseMember
    const ownerMember = await db.collection('basemembers').findOne({
      baseId: base._id,
      userId: base.ownerId
    });

    if (ownerMember) {
      console.log(`   ✅ Owner is in BaseMember with role: ${ownerMember.role}`);
      
      // Check if role is correct (should be owner)
      if (ownerMember.role !== 'owner') {
        console.log(`   🔧 Fixing role from ${ownerMember.role} to owner`);
        await db.collection('basemembers').updateOne(
          { _id: ownerMember._id },
          { $set: { role: 'owner' } }
        );
        console.log(`   ✅ Role fixed to owner`);
      }
    } else {
      console.log(`   ❌ Owner is NOT in BaseMember! Creating...`);
      
      // Create BaseMember for owner
      await db.collection('basemembers').insertOne({
        baseId: base._id,
        userId: base.ownerId,
        role: 'owner',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`   ✅ Created BaseMember for owner`);
    }

    // Get all BaseMembers for this base
    const baseMembers = await db.collection('basemembers').find({ baseId: base._id }).toArray();
    console.log(`   👥 Total members: ${baseMembers.length}`);
    baseMembers.forEach(member => {
      console.log(`      - User: ${member.userId} (${member.role})`);
    });
  }

  console.log('\n✅ BaseMember fix completed!');
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}
