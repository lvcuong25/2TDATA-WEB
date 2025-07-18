import mongoose from 'mongoose';
import User from './src/model/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@mongodb:27017/2TDATA?authSource=admin';

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const users = await User.find({}, 'email name role active site_id');
    console.log('📊 Users in database:');
    console.log(`Total users: ${users.length}`);
    
    users.forEach(user => {
      console.log(`  - ${user.email} | ${user.name} | ${user.role} | Active: ${user.active} | Site: ${user.site_id || 'N/A'}`);
    });
    
    // Check super admin specifically
    const superAdmin = await User.findOne({ email: 'superadmin@2tdata.com' });
    if (superAdmin) {
      console.log('\n👑 Super Admin found:');
      console.log(`  Email: ${superAdmin.email}`);
      console.log(`  Name: ${superAdmin.name}`);
      console.log(`  Role: ${superAdmin.role}`);
      console.log(`  Active: ${superAdmin.active}`);
      console.log(`  Password Hash: ${superAdmin.password ? 'Yes' : 'No'}`);
    } else {
      console.log('\n❌ Super Admin not found!');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsers();
