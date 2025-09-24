import mongoose from 'mongoose';
import Base from './src/model/Base.js';
import BaseMember from './src/model/BaseMember.js';
import User from './src/model/User.js';

// Connect to MongoDB
mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/2tdata');

async function checkBases() {
  try {
    console.log('🔍 Checking Base records...\n');

    // Get all bases
    const bases = await Base.find({}).lean();
    console.log(`📊 Found ${bases.length} bases`);

    for (const base of bases) {
      console.log(`\n📁 Base: ${base.name} (${base._id})`);
      console.log(`   Owner ID: ${base.ownerId}`);
      console.log(`   Org ID: ${base.orgId}`);

      // Check if owner is in BaseMember
      const ownerMember = await BaseMember.findOne({
        baseId: base._id,
        userId: base.ownerId
      }).lean();

      if (ownerMember) {
        console.log(`   ✅ Owner is in BaseMember with role: ${ownerMember.role}`);
      } else {
        console.log(`   ❌ Owner is NOT in BaseMember! Creating...`);
        
        // Create BaseMember for owner
        const newBaseMember = new BaseMember({
          baseId: base._id,
          userId: base.ownerId,
          role: 'owner'
        });
        
        await newBaseMember.save();
        console.log(`   ✅ Created BaseMember for owner`);
      }

      // Get all BaseMembers for this base
      const baseMembers = await BaseMember.find({ baseId: base._id })
        .populate('userId', 'name email')
        .lean();
      
      console.log(`   👥 Total members: ${baseMembers.length}`);
      baseMembers.forEach(member => {
        console.log(`      - ${member.userId?.name || member.userId} (${member.role})`);
      });
    }

    console.log('\n✅ Base check completed!');
  } catch (error) {
    console.error('❌ Error checking Bases:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkBases();
