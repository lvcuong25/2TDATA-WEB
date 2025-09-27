import mongoose from 'mongoose';
import User from './src/model/User.js';
import Site from './src/model/Site.js';

async function checkUserPermissions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/2TDATA');
    console.log('Connected to MongoDB');

    // Check user
    const user = await User.findById('68d6da9c34922bd7bb87a440');
    console.log('User:', {
      _id: user._id,
      email: user.email,
      site_id: user.site_id,
      role: user.role
    });

    // Check localhost site
    const localhostSite = await Site.findOne({ domains: 'localhost' });
    console.log('Localhost site:', {
      _id: localhostSite._id,
      name: localhostSite.name,
      domains: localhostSite.domains
    });

    // Check if user site_id matches localhost site
    console.log('User site_id matches localhost site:', user.site_id.toString() === localhostSite._id.toString());

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserPermissions();
