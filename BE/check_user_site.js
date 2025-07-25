import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
await mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/2TDATA-P');

const UserSchema = new mongoose.Schema({
  email: String,
  role: String,
  site_id: mongoose.Schema.Types.ObjectId,
  active: Boolean
}, { strict: false });

const SiteSchema = new mongoose.Schema({
  name: String,
  domain: String
}, { strict: false });

const RequestSchema = new mongoose.Schema({
  site_id: mongoose.Schema.Types.ObjectId,
  status: String
}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Site = mongoose.model('Site', SiteSchema);
const UserService = mongoose.model('UserService', RequestSchema);

async function checkData() {
  try {
    // Check user
    const user = await User.findOne({ email: 'quynam220502fptdp@outlook.com' });
    console.log('\n=== USER INFO ===');
    console.log('Email:', user?.email);
    console.log('Role:', user?.role);
    console.log('Site ID:', user?.site_id);
    console.log('Active:', user?.active);
    
    // Check site info
    if (user?.site_id) {
      const site = await Site.findById(user.site_id);
      console.log('\n=== USER SITE INFO ===');
      console.log('Site Name:', site?.name);
      console.log('Site Domain:', site?.domain);
    }
    
    // Check main site (2tdata.com)
    const mainSite = await Site.findOne({ domain: '2tdata.com' });
    console.log('\n=== MAIN SITE INFO ===');
    console.log('Site ID:', mainSite?._id);
    console.log('Site Name:', mainSite?.name);
    console.log('Site Domain:', mainSite?.domain);
    
    // Check request
    const request = await UserService.findById('685f681992d34e7a926718e9');
    console.log('\n=== REQUEST INFO ===');
    console.log('Request ID:', request?._id);
    console.log('Request Site ID:', request?.site_id);
    console.log('Request Status:', request?.status);
    
    if (request?.site_id) {
      const requestSite = await Site.findById(request.site_id);
      console.log('Request Site Name:', requestSite?.name);
      console.log('Request Site Domain:', requestSite?.domain);
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkData();
