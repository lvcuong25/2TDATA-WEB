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

  // Test query BaseMember for user trunglq8.93@gmail.com
  const user = await User.findOne({ email: 'trunglq8.93@gmail.com' });
  console.log('\n👤 User found:', user ? `${user.name} (${user._id})` : 'Not found');

  if (user) {
    // Find BaseMembers for this user
    const baseMembers = await BaseMember.find({ userId: user._id })
      .populate('baseId', 'name')
      .lean();
    
    console.log(`\n📊 BaseMembers for ${user.name}:`);
    baseMembers.forEach(member => {
      console.log(`   - Base: ${member.baseId?.name || member.baseId} (${member.baseId?._id || member.baseId})`);
      console.log(`     Role: ${member.role}`);
      console.log(`     Created: ${member.createdAt}`);
    });

    // Test API endpoint logic
    console.log('\n🔍 Testing API logic:');
    const databaseId = '68d400abc36df12bdeccc1ba'; // Test Database ID
    
    const baseMember = await BaseMember.findOne({ 
      baseId: databaseId, 
      userId: user._id 
    }).lean();
    
    if (baseMember) {
      console.log(`   ✅ User is member of database with role: ${baseMember.role}`);
      console.log(`   ✅ Can manage: ${baseMember.role === 'owner' || baseMember.role === 'manager'}`);
    } else {
      console.log(`   ❌ User is NOT a member of database ${databaseId}`);
    }
  }

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}
