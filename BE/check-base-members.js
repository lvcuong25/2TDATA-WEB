import mongoose from 'mongoose';
import BaseMember from './src/model/BaseMember.js';
import Database from './src/model/Database.js';
import User from './src/model/User.js';

// Connect to MongoDB
mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/2tdata');

async function checkBaseMembers() {
  try {
    console.log('🔍 Checking BaseMember records...\n');

    // Get all databases
    const databases = await Database.find({}).lean();
    console.log(`📊 Found ${databases.length} databases`);

    for (const database of databases) {
      console.log(`\n📁 Database: ${database.name} (${database._id})`);
      console.log(`   Owner ID: ${database.ownerId}`);
      console.log(`   Org ID: ${database.orgId}`);

      // Check if owner is in BaseMember
      const ownerMember = await BaseMember.findOne({
        baseId: database._id,
        userId: database.ownerId
      }).lean();

      if (ownerMember) {
        console.log(`   ✅ Owner is in BaseMember with role: ${ownerMember.role}`);
      } else {
        console.log(`   ❌ Owner is NOT in BaseMember! Creating...`);
        
        // Create BaseMember for owner
        const newBaseMember = new BaseMember({
          baseId: database._id,
          userId: database.ownerId,
          role: 'owner'
        });
        
        await newBaseMember.save();
        console.log(`   ✅ Created BaseMember for owner`);
      }

      // Get all BaseMembers for this database
      const baseMembers = await BaseMember.find({ baseId: database._id })
        .populate('userId', 'name email')
        .lean();
      
      console.log(`   👥 Total members: ${baseMembers.length}`);
      baseMembers.forEach(member => {
        console.log(`      - ${member.userId?.name || member.userId} (${member.role})`);
      });
    }

    console.log('\n✅ BaseMember check completed!');
  } catch (error) {
    console.error('❌ Error checking BaseMembers:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkBaseMembers();
