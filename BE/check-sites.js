import mongoose from 'mongoose';
import Site from './src/model/Site.js';

async function checkSites() {
  try {
    await mongoose.connect('mongodb://localhost:27017/2TDATA');
    console.log('Connected to MongoDB');

    const sites = await Site.find({});
    console.log('All sites:', sites.map(s => ({
      _id: s._id,
      name: s.name,
      domains: s.domains,
      status: s.status
    })));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSites();