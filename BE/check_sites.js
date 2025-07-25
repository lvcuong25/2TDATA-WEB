import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/2TDATA-P');

const SiteSchema = new mongoose.Schema({}, { strict: false });
const Site = mongoose.model('Site', SiteSchema);

async function checkSites() {
  try {
    const sites = await Site.find({});
    console.log('\n=== ALL SITES ===');
    sites.forEach(site => {
      console.log('\nSite ID:', site._id);
      console.log('Name:', site.name);
      console.log('Domain:', site.domain);
      console.log('Domains:', site.domains);
      console.log('Status:', site.status);
    });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkSites();
