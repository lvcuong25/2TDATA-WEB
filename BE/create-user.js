import mongoose from 'mongoose';
import User from './src/model/User.js';
import Site from './src/model/Site.js';
import bcrypt from 'bcryptjs';

async function createUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/2TDATA');
    console.log('Connected to MongoDB');

    // Get localhost site
    const localhostSite = await Site.findOne({ domains: 'localhost' });
    console.log('Localhost site:', localhostSite._id);

    // Create user
    const hashedPassword = await bcrypt.hash('Manager123', 10);
    const user = await User.create({
      email: 'manager@test.com',
      password: hashedPassword,
      name: 'Quang Trung',
      role: 'site_admin',
      site_id: localhostSite._id,
      active: true
    });

    console.log('User created:', {
      _id: user._id,
      email: user.email,
      site_id: user.site_id,
      role: user.role
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
}

createUser();
