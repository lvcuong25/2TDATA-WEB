import User from './src/model/User.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Use environment variable for MongoDB connection
const mongoUri = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://admin:password@host.docker.internal:27017/2TDATA?authSource=admin';

console.log('Connecting to MongoDB:', mongoUri.replace(/password@/, '***@'));

mongoose.connect(mongoUri).then(async () => {
  try {
    console.log('✅ Connected to MongoDB');
    
    const email = 'superadmin@2tdata.com';
    const newPassword = 'admin123';
    
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
          role: 'super_admin'
        }
      );
      console.log(`✅ Password reset successful for existing user: ${email}`);
    } else {
      // Create new superadmin user
      const newUser = new User({
        email,
        password: hashedPassword,
        name: 'Super Admin',
        role: 'super_admin',
        active: true
      });
      await newUser.save();
      console.log(`✅ New superadmin user created: ${email}`);
    }
    
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${newPassword}`);
    console.log(`🔐 Role: super_admin`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}).catch(error => {
  console.error('❌ MongoDB connection error:', error);
});
