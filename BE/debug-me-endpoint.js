import mongoose from 'mongoose';
import BaseMember from './src/model/BaseMember.js';

// Connect to MongoDB
const DB_URI = 'mongodb://localhost:27017/2TDATA-P';
console.log('Connecting to:', DB_URI);

try {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected to MongoDB');

  const databaseId = '68d4068c5a40b576555afbf8'; // Test Role database ID
  const userId = '68341e4d3f86f9c7ae46e962'; // Quang Trung user ID
  
  console.log(`\n🔍 Debugging /me endpoint logic for database: ${databaseId}`);
  console.log(`User ID: ${userId}`);
  
  // Test different ways to query BaseMember
  console.log('\n1. Testing with string IDs:');
  const member1 = await BaseMember.findOne({ 
    baseId: databaseId, 
    userId: userId 
  }).lean();
  console.log('Result with string IDs:', member1);
  
  console.log('\n2. Testing with ObjectId:');
  const member2 = await BaseMember.findOne({ 
    baseId: new mongoose.Types.ObjectId(databaseId), 
    userId: new mongoose.Types.ObjectId(userId) 
  }).lean();
  console.log('Result with ObjectId:', member2);
  
  console.log('\n3. Testing with mixed types:');
  const member3 = await BaseMember.findOne({ 
    baseId: new mongoose.Types.ObjectId(databaseId), 
    userId: userId 
  }).lean();
  console.log('Result with mixed types:', member3);
  
  console.log('\n4. Testing with reverse mixed types:');
  const member4 = await BaseMember.findOne({ 
    baseId: databaseId, 
    userId: new mongoose.Types.ObjectId(userId) 
  }).lean();
  console.log('Result with reverse mixed types:', member4);
  
  // Test what's actually in the database
  console.log('\n5. Testing raw database query:');
  const db = mongoose.connection.db;
  const rawMember = await db.collection('basemembers').findOne({ 
    baseId: new mongoose.Types.ObjectId(databaseId), 
    userId: new mongoose.Types.ObjectId(userId) 
  });
  console.log('Raw database result:', rawMember);
  
  // Test all BaseMembers for this database
  console.log('\n6. All BaseMembers for this database:');
  const allMembers = await db.collection('basemembers').find({ 
    baseId: new mongoose.Types.ObjectId(databaseId) 
  }).toArray();
  console.log('All members:', allMembers);

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}
