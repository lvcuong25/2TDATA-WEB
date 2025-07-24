import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/model/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/2TDATA?authSource=admin';

const resetAllSiteAdmins = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    // Reset all site admins
    const siteAdmins = [
      'admin@techhub.2tdata.com',
      'admin@finance.2tdata.com'
    ];
    
    for (const email of siteAdmins) {
      await User.updateOne(
        { email },
        { 
          password: hashedPassword,
          active: true
        }
      );
      console.log(`✅ Reset password for ${email}`);
    }
    
    console.log('\n🔐 All site admin credentials:');
    console.log('📧 admin@techhub.2tdata.com - Password: admin123');
    console.log('📧 admin@finance.2tdata.com - Password: admin123');
    console.log('📧 superadmin@2tdata.com - Password: admin123');
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

resetAllSiteAdmins();
