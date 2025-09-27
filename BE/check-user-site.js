import mongoose from 'mongoose';
import User from './src/model/User.js';
import Site from './src/model/Site.js';

async function checkUserSite() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/2TDATA');
    console.log('Connected to MongoDB');

    // Check all users
    const users = await User.find({});
    console.log('All users:', users.map(u => ({
      _id: u._id,
      email: u.email,
      site_id: u.site_id,
      role: u.role
    })));

    // Check localhost site
    const localhostSite = await Site.findOne({ domains: 'localhost' });
    console.log('Localhost site:', {
      _id: localhostSite._id,
      name: localhostSite.name,
      domains: localhostSite.domains,
      status: localhostSite.status
    });

    process.exit(0);
  } catch (error) {
    console.error('Error checking user site:', error);
    process.exit(1);
  }
}

checkUserSite();