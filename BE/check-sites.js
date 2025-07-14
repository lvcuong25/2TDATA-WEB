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
    console.log('🌐 Available sites:');
    sites.forEach(site => {
      console.log(`📍 ${site.name} - Domain: ${site.domains} - ID: ${site._id}`);
    });
    
    const site1 = await Site.findOne({ domains: 'site1.localhost' });
    const mainSite = await Site.findOne({ domains: 'localhost' });
    
    console.log('\n🔍 Special sites:');
    if (site1) console.log(`🏠 Site1: ${site1.name} - ${site1.domains}`);
    if (mainSite) console.log(`🏢 Main: ${mainSite.name} - ${mainSite.domains}`);
    
    console.log('\n📊 Total sites:', sites.length);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSites();
