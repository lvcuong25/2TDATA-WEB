import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Site from './src/model/Site.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/user';

async function findSite() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const sites = await Site.find({});
    console.log('Total sites:', sites.length);
    
    sites.forEach(site => {
      console.log('\nSite ID:', site._id);
      console.log('Name:', site.name);
      console.log('Domains:', site.domains);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findSite();
