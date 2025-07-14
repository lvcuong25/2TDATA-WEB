import User from './src/model/User.js';
import mongoose from 'mongoose';

mongoose.connect('mongodb://admin:password@172.18.0.3:27017/2TDATA?authSource=admin').then(async () => {
  try {
    const users = await User.find({ role: { $in: ['admin', 'super_admin'] } });
    users.forEach(u => {
      });
    
    // Also check all users
    const allUsers = await User.find({});
    allUsers.forEach(u => {
      });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
});
