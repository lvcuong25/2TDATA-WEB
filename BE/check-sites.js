import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Site from './src/model/Site.js';

// Load environment variables
dotenv.config();

async function checkSites() {
  try {
    const dbUri = process.env.DB_URI || 'mongodb://admin:password@localhost:27017/2TDATA?authSource=admin';
    await mongoose.connect(dbUri);
    const sites = await Site.find({});
    sites.forEach(site => {
      });
    
    const site1 = await Site.findOne({ domains: 'site1.localhost' });
    const mainSite = await Site.findOne({ domains: 'localhost' });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSites();
