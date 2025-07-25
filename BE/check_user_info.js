import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/2TDATA-P');

const UserSchema = new mongoose.Schema({}, { strict: false });
const UserServiceSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', UserSchema);
const UserService = mongoose.model('UserService', UserServiceSchema);

async function checkUserInfo() {
  try {
    // Check the user
    const user = await User.findOne({ email: 'quynam220502fptdp@outlook.com' });

    console.log('\n=== USER FULL INFO ===');
    console.log(JSON.stringify({
      _id: user._id,
      email: user.email,
      role: user.role,
      site_id: user.site_id,
      active: user.active,
      service: user.service
    }, null, 2));

    // Check the specific request
    const request = await UserService.findById('685f681992d34e7a926718e9');
    console.log('\n=== REQUEST FULL INFO ===');
    console.log(JSON.stringify({
      _id: request._id,
      site_id: request.site_id,
      status: request.status,
      user: request.user
    }, null, 2));

    // Check the site matching
    console.log('\n=== SITE ID MATCHING ===');
    console.log('User Site ID:', user.site_id);
    console.log('Request Site ID:', request.site_id);
    console.log('Match:', user.site_id.toString() === request.site_id.toString());

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkUserInfo();
