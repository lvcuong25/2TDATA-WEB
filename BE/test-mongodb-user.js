import mongoose from 'mongoose';
import User from './src/model/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });
dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/2TDATA-P';

async function testMongoDBUser() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const userId = '68341e4d3f86f9c7ae46e962';
    console.log(`🔍 Looking for user: ${userId}`);
    
    const user = await User.findById(userId);
    console.log('User found:', user ? {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      active: user.active,
      role: user.role
    } : 'null');

    if (!user) {
      console.log('❌ User not found in MongoDB');
    } else {
      console.log('✅ User found in MongoDB');
    }

  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('⚠️ Disconnected from MongoDB');
  }
}

testMongoDBUser();

