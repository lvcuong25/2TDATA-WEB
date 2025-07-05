import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/model/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://admin:password@localhost:27017/2TDATA?authSource=admin';

);

/**
 * Reset or create superadmin account
 */
const resetSuperAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    const email = 'superadmin@2tdata.com';
    const newPassword = process.argv[2] || 'admin123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      // Update existing user
      await User.updateOne(
        { email },
        { 
          password: hashedPassword,
          active: true,
          role: 'super_admin',
          name: existingUser.name || 'Super Administrator'
        }
      );
      } else {
      // Create new superadmin user
      const newUser = new User({
        email,
        password: hashedPassword,
        name: 'Super Administrator',
        role: 'super_admin',
        active: true
        // Note: super_admin doesn't need site_id
      });
      await newUser.save();
      }
    
    } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    }
};

// Run the reset
resetSuperAdmin()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Superadmin reset failed:', error);
    process.exit(1);
  });
