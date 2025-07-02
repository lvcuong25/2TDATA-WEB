import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Site from './src/model/Site.js';

// Load environment variables
dotenv.config();

async function checkSites() {
  try {
    const dbUri = process.env.DB_URI || 'mongodb://admin:password@localhost:27017/2TDATA?authSource=admin';
    await mongoose.connect(dbUri);
    console.log('Connected to database');
    
    const sites = await Site.find({});
    console.log('All sites:');
    sites.forEach(site => {
      console.log('ID:', site._id);
      console.log('Name:', site.name);
      console.log('Domains:', site.domains);
      console.log('Status:', site.status);
      console.log('---');
    });
    
    const site1 = await Site.findOne({ domains: 'site1.localhost' });
    console.log('Site for site1.localhost:', site1 ? site1.name : 'Not found');
    
    const mainSite = await Site.findOne({ domains: 'localhost' });
    console.log('Site for localhost:', mainSite ? mainSite.name : 'Not found');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSites();
