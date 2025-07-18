import mongoose from 'mongoose';
import User from './src/model/User.js';
import dotenv from 'dotenv';

dotenv.config();

const checkSiteId = async () => {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/2TDATA?authSource=admin';
    await mongoose.connect(dbUri);
    
    console.log('🔍 Checking site_id issues...\n');
    
    // Kiểm tra superadmin
    const superadmin = await User.findOne({ email: 'superadmin@2tdata.com' });
    console.log('🔑 Superadmin info:');
    console.log(`   Email: ${superadmin.email}`);
    console.log(`   Role: ${superadmin.role}`);
    console.log(`   Site ID: ${superadmin.site_id || 'NULL'}`);
    console.log(`   Active: ${superadmin.active}\n`);
    
    // Kiểm tra các user có site_id
    const usersWithSiteId = await User.find({ site_id: { $exists: true, $ne: null } });
    console.log('👥 Users with site_id:');
    usersWithSiteId.forEach(user => {
      console.log(`   📧 ${user.email} - Site ID: ${user.site_id} - Role: ${user.role}`);
    });
    
    // Kiểm tra users không có site_id
    const usersWithoutSiteId = await User.find({ 
      $or: [
        { site_id: { $exists: false } },
        { site_id: null }
      ]
    });
    console.log(`\n❌ Users without site_id (${usersWithoutSiteId.length}):`);
    usersWithoutSiteId.forEach(user => {
      console.log(`   📧 ${user.email} - Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

checkSiteId();
