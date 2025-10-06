import mongoose from 'mongoose';
import BaseMember from './src/model/BaseMember.js';
import User from './src/model/User.js';

const MONGODB_URI = 'mongodb://localhost:27017/2TDATA-P';

async function checkMembers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const databaseId = '68de834d188faaa09c80b006';
    const userId = '685146504543b4acb407d8c5'; // test@hcw.com.vn

    console.log('Checking database members...');
    const members = await BaseMember.find({ databaseId: databaseId }).populate('userId', 'name email');
    
    console.log(`Found ${members.length} members:`);
    members.forEach(member => {
      console.log(`- ${member.userId.email} (${member.userId.name}): ${member.role}`);
    });

    console.log('\nChecking specific user...');
    const userMember = await BaseMember.findOne({
      userId: userId,
      databaseId: databaseId
    }).populate('userId', 'name email');

    if (userMember) {
      console.log(`✅ User found: ${userMember.userId.email} (${userMember.userId.name}): ${userMember.role}`);
    } else {
      console.log('❌ User not found in database members');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkMembers();
