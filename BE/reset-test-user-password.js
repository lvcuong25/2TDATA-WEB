import mongoose from 'mongoose';
import User from './src/model/User.js';
import pkg from 'bcryptjs';
const { hashSync } = pkg;

console.log('=== RESET TEST USER PASSWORD ===');

async function resetTestUserPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2TDATA-P');
    console.log('✅ MongoDB connected');
    
    const email = 'test@hcw.com.vn';
    const newPassword = '123456';
    
    console.log(`\n🔍 Resetting password for user: ${email}`);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    // Hash new password
    const hashedPassword = hashSync(newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Password reset successful');
    console.log('✅ New password:', newPassword);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetTestUserPassword();
