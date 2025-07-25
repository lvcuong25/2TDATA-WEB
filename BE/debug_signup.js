import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/2TDATA-P');

const SiteSchema = new mongoose.Schema({}, { strict: false });
const Site = mongoose.model('Site', SiteSchema);

async function checkSite() {
  try {
    // Check nguyenhungmarketing site
    const site = await Site.findOne({ domains: 'nguyenhungmarketing.2tdata.com' });
    console.log('\n=== NGUYENHUNG SITE INFO ===');
    console.log(JSON.stringify({
      _id: site._id,
      name: site.name,
      domains: site.domains,
      status: site.status
    }, null, 2));
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkSite();
