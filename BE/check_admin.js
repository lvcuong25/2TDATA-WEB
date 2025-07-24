import User from './src/model/User.js';
import mongoose from 'mongoose';

mongoose.connect('mongodb://admin:password123@localhost:27017/2TDATA?authSource=admin').then(async () => {
  try {
    const users = await User.find({ role: { $in: ['admin', 'super_admin'] } });
    console.log('🔑 Admin/Super Admin users:');
    users.forEach(u => {
      console.log(`📧 ${u.email} - Role: ${u.role} - Active: ${u.active} - Site: ${u.site_id || 'None'}`);
    });
    
    // Also check all users
    const allUsers = await User.find({});
    console.log('\n👥 All users:');
    allUsers.forEach(u => {
      console.log(`📧 ${u.email} - Role: ${u.role} - Active: ${u.active} - Site: ${u.site_id || 'None'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
});
