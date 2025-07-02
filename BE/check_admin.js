import User from './src/model/User.js';
import mongoose from 'mongoose';

mongoose.connect('mongodb://admin:password@172.18.0.3:27017/2TDATA?authSource=admin').then(async () => {
  try {
    const users = await User.find({ role: { $in: ['admin', 'super_admin'] } });
    console.log('Admin users:');
    users.forEach(u => {
      console.log(`- Email: ${u.email}, Role: ${u.role}, Active: ${u.active}`);
    });
    
    // Also check all users
    const allUsers = await User.find({});
    console.log('\nAll users:');
    allUsers.forEach(u => {
      console.log(`- Email: ${u.email}, Role: ${u.role}, Active: ${u.active}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
});
