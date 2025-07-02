import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import User from '../src/model/User.js';
import Site from '../src/model/Site.js';
import Service from '../src/model/Service.js';
import Blog from '../src/model/Blog.js';
import UserService from '../src/model/UserService.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://admin:password@localhost:27017/2TDATA?authSource=admin';

console.log('🔗 Connecting to MongoDB:', MONGODB_URI.replace(/password@/, '***@'));

/**
 * Database cleanup operations
 */
const cleanup = async () => {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const operations = [];

    // Check what cleanup operations to perform
    if (args.includes('--test-data') || args.includes('--all')) {
      operations.push('test-data');
    }
    if (args.includes('--inactive-users') || args.includes('--all')) {
      operations.push('inactive-users');
    }
    if (args.includes('--rejected-services') || args.includes('--all')) {
      operations.push('rejected-services');
    }
    if (args.includes('--old-otps') || args.includes('--all')) {
      operations.push('old-otps');
    }
    if (args.includes('--demo-sites') || args.includes('--all')) {
      operations.push('demo-sites');
    }

    if (operations.length === 0) {
      console.log('ℹ️  No cleanup operations specified. Available options:');
      console.log('   --test-data        Remove test/demo data');
      console.log('   --inactive-users   Remove inactive users (older than 30 days)');
      console.log('   --rejected-services Remove rejected services');
      console.log('   --old-otps         Clear expired OTP codes');
      console.log('   --demo-sites       Remove demo sites and their data');
      console.log('   --all              Perform all cleanup operations');
      console.log('\nExample: node cleanup.js --test-data --old-otps');
      return;
    }

    let totalCleaned = 0;

    // 1. Remove test/demo data
    if (operations.includes('test-data')) {
      console.log('\n🗑️  Removing test data...');
      
      // Remove users with test emails
      const testUsers = await User.deleteMany({
        email: { $regex: /(test|demo|sample)@/i }
      });
      console.log(`   ✅ Removed ${testUsers.deletedCount} test users`);
      totalCleaned += testUsers.deletedCount;

      // Remove test services
      const testServices = await Service.deleteMany({
        name: { $regex: /(test|demo|sample)/i }
      });
      console.log(`   ✅ Removed ${testServices.deletedCount} test services`);
      totalCleaned += testServices.deletedCount;
    }

    // 2. Remove inactive users
    if (operations.includes('inactive-users')) {
      console.log('\n👤 Removing inactive users...');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const inactiveUsers = await User.deleteMany({
        active: false,
        role: { $ne: 'super_admin' }, // Never delete super admin
        createdAt: { $lt: thirtyDaysAgo }
      });
      console.log(`   ✅ Removed ${inactiveUsers.deletedCount} inactive users`);
      totalCleaned += inactiveUsers.deletedCount;
    }

    // 3. Remove rejected services
    if (operations.includes('rejected-services')) {
      console.log('\n🔧 Removing rejected services...');
      
      const rejectedServices = await Service.deleteMany({
        status: 'rejected'
      });
      console.log(`   ✅ Removed ${rejectedServices.deletedCount} rejected services`);
      totalCleaned += rejectedServices.deletedCount;
    }

    // 4. Clear expired OTP codes
    if (operations.includes('old-otps')) {
      console.log('\n🔐 Clearing expired OTPs...');
      
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const clearedOtps = await User.updateMany(
        {
          otpCreatedAt: { $lt: oneHourAgo }
        },
        {
          $unset: { otp: "", otpCreatedAt: "" }
        }
      );
      console.log(`   ✅ Cleared OTPs from ${clearedOtps.modifiedCount} users`);
      totalCleaned += clearedOtps.modifiedCount;
    }

    // 5. Remove demo sites and their data
    if (operations.includes('demo-sites')) {
      console.log('\n🌍 Removing demo sites...');
      
      // Find demo sites
      const demoSites = await Site.find({
        $or: [
          { name: { $regex: /(demo|test|sample)/i } },
          { domains: { $elemMatch: { $regex: /(demo|test|sample)/i } } }
        ]
      });

      let removedSites = 0;
      let removedUsers = 0;
      let removedServices = 0;

      for (const site of demoSites) {
        // Remove users associated with this site
        const siteUsers = await User.deleteMany({ site_id: site._id });
        removedUsers += siteUsers.deletedCount;

        // Remove services associated with this site
        const siteServices = await Service.deleteMany({ site_id: site._id });
        removedServices += siteServices.deletedCount;

        // Remove the site itself
        await Site.deleteOne({ _id: site._id });
        removedSites++;

        console.log(`   ✅ Removed demo site: ${site.name}`);
      }

      console.log(`   📊 Summary: ${removedSites} sites, ${removedUsers} users, ${removedServices} services`);
      totalCleaned += removedSites + removedUsers + removedServices;
    }

    // 6. Cleanup orphaned data
    console.log('\n🔗 Cleaning up orphaned data...');
    
    // Remove services with invalid site_id
    const invalidServices = await Service.deleteMany({
      site_id: { $nin: await Site.distinct('_id') }
    });
    console.log(`   ✅ Removed ${invalidServices.deletedCount} orphaned services`);
    totalCleaned += invalidServices.deletedCount;

    // Remove users with invalid site_id (except super_admin)
    const invalidUsers = await User.deleteMany({
      role: { $ne: 'super_admin' },
      site_id: { 
        $exists: true,
        $nin: await Site.distinct('_id') 
      }
    });
    console.log(`   ✅ Removed ${invalidUsers.deletedCount} orphaned users`);
    totalCleaned += invalidUsers.deletedCount;

    // Update site statistics
    console.log('\n📊 Updating site statistics...');
    const sites = await Site.find();
    for (const site of sites) {
      const userCount = await User.countDocuments({ site_id: site._id });
      const serviceCount = await Service.countDocuments({ site_id: site._id });
      
      await Site.updateOne(
        { _id: site._id },
        {
          'stats.totalUsers': userCount,
          'stats.totalContent': serviceCount,
          'stats.lastActivity': new Date()
        }
      );
    }
    console.log(`   ✅ Updated statistics for ${sites.length} sites`);

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log(`📊 Total items cleaned: ${totalCleaned}`);
    
    // Show final statistics
    console.log('\n📈 Current database state:');
    console.log(`   🌍 Sites: ${await Site.countDocuments()}`);
    console.log(`   👥 Users: ${await User.countDocuments()}`);
    console.log(`   🔧 Services: ${await Service.countDocuments()}`);
    console.log(`   👑 Super Admins: ${await User.countDocuments({ role: 'super_admin' })}`);
    console.log(`   🏛️ Site Admins: ${await User.countDocuments({ role: 'site_admin' })}`);
    console.log(`   ✅ Active Users: ${await User.countDocuments({ active: true })}`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the cleanup
cleanup()
  .then(() => {
    console.log('✅ Cleanup process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup process failed:', error);
    process.exit(1);
  });
