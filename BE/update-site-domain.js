import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Site from './src/model/Site.js';

// Load environment variables
dotenv.config();

async function updateSiteDomain(siteId, newDomain) {
  try {
    const dbUri = process.env.DB_URI || 'mongodb://admin:password@localhost:27017/2TDATA?authSource=admin';
    await mongoose.connect(dbUri);
    
    const site = await Site.findById(siteId);
    if (!site) {
      console.log('❌ Site not found');
      process.exit(1);
    }
    
    console.log(`🔄 Updating site: ${site.name}`);
    console.log(`Old domain: ${site.domains}`);
    console.log(`New domain: ${newDomain}`);
    
    // Check if new domain already exists
    const existingDomain = await Site.findOne({ domains: newDomain });
    if (existingDomain) {
      console.log('❌ New domain already exists');
      process.exit(1);
    }
    
    site.domains = [newDomain];
    await site.save();
    
    console.log('✅ Site domain updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get arguments from command line
const siteId = process.argv[2];
const newDomain = process.argv[3];

if (!siteId || !newDomain) {
  console.log('Usage: node update-site-domain.js <site_id> <new_domain>');
  console.log('Example: node update-site-domain.js 6874ad5d0a6172df97e917a7 site1-updated.localhost');
  process.exit(1);
}

updateSiteDomain(siteId, newDomain);
