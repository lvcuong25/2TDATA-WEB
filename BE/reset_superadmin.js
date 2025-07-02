import User from './src/model/User.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

mongoose.connect('mongodb://admin:password@172.18.0.3:27017/2TDATA?authSource=admin').then(async () => {
  try {
    const email = 'superadmin@2tdata.com';
    const newPassword = 'admin123';
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await User.updateOne(
      { email },
      { 
        password: hashedPassword,
        active: true 
      }
    );
    
    console.log(`✅ Password reset successful for ${email}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New password: ${newPassword}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
});
