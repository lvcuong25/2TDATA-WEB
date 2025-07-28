import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/2TDATA-P');

const UserSchema = new mongoose.Schema({}, { strict: false });
const UserServiceSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', UserSchema);
const UserService = mongoose.model('UserService', UserServiceSchema);

async function checkUserPermission() {
  try {
    // Check user
    const user = await User.findOne({ email: 'quynam220502fptdp@outlook.com' }).populate('site_id');
    console.log('\n=== USER FULL INFO ===');
    console.log(JSON.stringify({
      _id: user._id,
      email: user.email,
      role: user.role,
      site_id: user.site_id?._id,
      site_name: user.site_id?.name,
      active: user.active,
      service: user.service
    }, null, 2));
    
    // Check specific request
    const request = await UserService.findById('685f681992d34e7a926718e9').populate('site_id');
    console.log('\n=== REQUEST FULL INFO ===');
    console.log(JSON.stringify({
      _id: request._id,
      site_id: request.site_id?._id,
      site_name: request.site_id?.name,
      status: request.status,
      user: request.user
    }, null, 2));
    
    // Check if they match
    console.log('\n=== PERMISSION CHECK ===');
    const userSiteId = user.site_id?._id?.toString() || user.site_id?.toString();
    const requestSiteId = request.site_id?._id?.toString() || request.site_id?.toString();
    console.log('User Site ID:', userSiteId);
    console.log('Request Site ID:', requestSiteId);
    console.log('Match:', userSiteId === requestSiteId);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkUserPermission();
