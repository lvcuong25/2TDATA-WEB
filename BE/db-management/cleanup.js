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

);

/**
 * Database cleanup operations
 */
const cleanup = async () => {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
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
      ');
      return;
    }

    let totalCleaned = 0;

    // 1. Remove test/demo data
    if (operations.includes('test-data')) {
      // Remove users with test emails
      const testUsers = await User.deleteMany({
        email: { $regex: /(test|demo|sample)@/i }
      });
      totalCleaned += testUsers.deletedCount;

      // Remove test services
      const testServices = await Service.deleteMany({
        name: { $regex: /(test|demo|sample)/i }
      });
      totalCleaned += testServices.deletedCount;
    }

    // 2. Remove inactive users
    if (operations.includes('inactive-users')) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const inactiveUsers = await User.deleteMany({
        active: false,
        role: { $ne: 'super_admin' }, // Never delete super admin
        createdAt: { $lt: thirtyDaysAgo }
      });
      totalCleaned += inactiveUsers.deletedCount;
    }

    // 3. Remove rejected services
    if (operations.includes('rejected-services')) {
      const rejectedServices = await Service.deleteMany({
        status: 'rejected'
      });
      totalCleaned += rejectedServices.deletedCount;
    }

    // 4. Clear expired OTP codes
    if (operations.includes('old-otps')) {
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
      totalCleaned += clearedOtps.modifiedCount;
    }

    // 5. Remove demo sites and their data
    if (operations.includes('demo-sites')) {
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

        }

      totalCleaned += removedSites + removedUsers + removedServices;
    }

    // 6. Cleanup orphaned data
    // Remove services with invalid site_id
    const invalidServices = await Service.deleteMany({
      site_id: { $nin: await Site.distinct('_id') }
    });
    totalCleaned += invalidServices.deletedCount;

    // Remove users with invalid site_id (except super_admin)
    const invalidUsers = await User.deleteMany({
      role: { $ne: 'super_admin' },
      site_id: { 
        $exists: true,
        $nin: await Site.distinct('_id') 
      }
    });
    totalCleaned += invalidUsers.deletedCount;

    // Update site statistics
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
    // Show final statistics
    }`);
    }`);
    }`);
    }`);
    }`);
    }`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    }
};

// Run the cleanup
cleanup()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup process failed:', error);
    process.exit(1);
  });
