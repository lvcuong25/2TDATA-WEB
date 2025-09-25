import mongoose from 'mongoose';
import BaseMember from './src/model/BaseMember.js';
import Database from './src/model/Database.js';
import User from './src/model/User.js';

// Connect to MongoDB
const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/2TDATA-P';
console.log('Connecting to:', DB_URI);

try {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected to MongoDB');

  // Test user
  const user = await User.findOne({ email: 'trunglq8.93@gmail.com' });
  console.log('\n👤 User:', user ? `${user.name} (${user._id})` : 'Not found');

  if (user) {
    // Test database ID from the image
    const databaseId = '68d400abc36df12bdeccc1ba'; // Test Database ID
    
    console.log(`\n🔍 Testing /database/databases/${databaseId}/members/me endpoint logic:`);
    
    // Simulate the API logic
    const member = await BaseMember.findOne({ 
      baseId: databaseId, 
      userId: user._id 
    }).lean();
    
    console.log('BaseMember query result:', member);
    
    if (!member) {
      console.log('❌ API would return: { ok: true, isMember: false }');
    } else {
      console.log('✅ API would return:');
      console.log({
        ok: true,
        isMember: true,
        member: {
          _id: member._id,
          role: member.role,
          canManageDatabase: member.role === "owner" || member.role === "manager",
        }
      });
    }

    // Test all databases for this user
    console.log('\n📊 All BaseMembers for this user:');
    const allMembers = await BaseMember.find({ userId: user._id })
      .populate('baseId', 'name')
      .lean();
    
    allMembers.forEach(member => {
      console.log(`   - Base: ${member.baseId?.name || member.baseId} (${member.baseId?._id || member.baseId})`);
      console.log(`     Role: ${member.role}`);
      console.log(`     Can manage: ${member.role === "owner" || member.role === "manager"}`);
    });
  }

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}
