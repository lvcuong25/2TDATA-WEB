import mongoose from 'mongoose';
import User from './src/model/User.js';

console.log('=== CHECKING USER EXISTS ===');

async function checkUserExists() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2TDATA-P');
    console.log('✅ MongoDB connected');
    
    const email = 'test@hcw.com.vn';
    
    // Also check for other test users
    const testEmails = ['test@hcw.com.vn', 'manager@test.com', 'admin@test.com'];
    
    // Check all test users
    for (const testEmail of testEmails) {
      console.log(`\n🔍 Checking user: ${testEmail}`);
      const user = await User.findOne({ email: testEmail });
      
      if (!user) {
        console.log('❌ User not found');
      } else {
        console.log('✅ User found:');
        console.log('  - ID:', user._id);
        console.log('  - Email:', user.email);
        console.log('  - Name:', user.name);
        console.log('  - Role:', user.role);
        console.log('  - Active:', user.active);
        console.log('  - Site ID:', user.site_id);
      }
    }
    
    // List all users
    console.log('\n🔍 All users in database:');
    const allUsers = await User.find({}, 'email name role active');
    console.log(`Total users: ${allUsers.length}`);
    allUsers.forEach((u, index) => {
      console.log(`  ${index + 1}. ${u.email} - ${u.name} - ${u.role} - ${u.active ? 'active' : 'inactive'}`);
    });
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkUserExists();
