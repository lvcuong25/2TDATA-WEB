import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Site from './src/model/Site.js';

// Load environment variables
dotenv.config();

async function deleteSiteById(siteId) {
  try {
    const dbUri = process.env.DB_URI || 'mongodb://admin:password@localhost:27017/2TDATA?authSource=admin';
    await mongoose.connect(dbUri);
    
    const site = await Site.findById(siteId);
    if (!site) {
      console.log('❌ Site not found');
      process.exit(1);
    }
    
    console.log(`🗑️ Deleting site: ${site.name} - ${site.domains}`);
    await Site.findByIdAndDelete(siteId);
    console.log('✅ Site deleted successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get site ID from command line argument
const siteId = process.argv[2];
if (!siteId) {
  console.log('Usage: node delete-site.js <site_id>');
  console.log('Example: node delete-site.js 6874ad5d0a6172df97e917a7');
  process.exit(1);
}

deleteSiteById(siteId);
