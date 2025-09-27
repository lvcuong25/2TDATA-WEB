import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Database from './src/model/Database.js';
import BaseMember from './src/model/BaseMember.js';
import User from './src/model/User.js';

dotenv.config();

async function debugDatabases() {
  try {
    await mongoose.connect(process.env.DB_URI || 'mongodb://2tdata_p_user:2tdata_p%402024%21@localhost:27017/2TDATA-P?authSource=2TDATA-P');
    console.log('✅ Connected to MongoDB\n');
    
    // 1. Check super admin
    const superAdmin = await User.findOne({email: 'superadmin@2tdata.com'});
    console.log('👤 SUPER ADMIN:');
    console.log(`  - ID: ${superAdmin._id}`);
    console.log(`  - Role: ${superAdmin.role}`);
    console.log(`  - Is Super Admin: ${superAdmin.role === 'super_admin'}\n`);
    
    // 2. Check all databases in system
    const allDatabases = await Database.find({});
    console.log(`📊 Total databases in MongoDB: ${allDatabases.length}`);
    
    // 3. Check databases super admin is member of
    const superAdminMembers = await BaseMember.find({ userId: superAdmin._id });
    console.log(`\n👥 Super admin is member of ${superAdminMembers.length} databases through BaseMember`);
    
    // 4. Show databases details
    console.log('\n📚 ALL DATABASES IN SYSTEM:');
    for (const db of allDatabases) {
      const isMember = superAdminMembers.some(m => m.databaseId?.toString() === db._id.toString());
      console.log(`  - ${db.name} (ID: ${db._id})`);
      console.log(`    OrgId: ${db.orgId || 'N/A'}`);
      console.log(`    Super Admin is member: ${isMember ? '✅ Yes' : '❌ No'}`);
    }
    
    // 5. The issue
    console.log('\n⚠️ ISSUE:');
    if (superAdmin.role === 'super_admin') {
      console.log('Super admin SHOULD see all databases but only sees databases they are member of.');
      console.log('The isSuperAdmin function might not be getting the correct user object.');
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.disconnect();
  }
}

debugDatabases();
