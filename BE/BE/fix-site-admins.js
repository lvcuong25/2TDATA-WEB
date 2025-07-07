import mongoose from 'mongoose';
import User from './src/model/User.js';
import Site from './src/model/Site.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixSiteAdmins() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/2tdata';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find main site
    const mainSite = await Site.findOne({
      $or: [
        { is_main_site: true },
        { domains: { $in: ['localhost', '2tdata.com'] } },
        { name: /main|master|2tdata/i }
      ]
    }).sort({ createdAt: 1 });

    if (!mainSite) {
      console.error('Main site not found!');
      return;
    }

    console.log(`Found main site: ${mainSite.name} (${mainSite._id})`);
    console.log(`Domains: ${mainSite.domains.join(', ')}`);

    // Find all site_admin users for the main site
    const siteAdmins = await User.find({
      site_id: mainSite._id,
      role: 'site_admin'
    });

    console.log(`\nFound ${siteAdmins.length} site_admin users for main site:`);
    
    for (const admin of siteAdmins) {
      console.log(`- ${admin.email} (${admin.name || 'No name'}) - Role: ${admin.role}`);
      
      // Delete site_admin users from main site
      await User.deleteOne({ _id: admin._id });
      console.log(`  ✓ Deleted site_admin: ${admin.email}`);
    }

    // Also remove from site_admins array in Site model
    if (mainSite.site_admins && mainSite.site_admins.length > 0) {
      console.log(`\nRemoving ${mainSite.site_admins.length} entries from site_admins array`);
      mainSite.site_admins = [];
      await mainSite.save();
      console.log('✓ Cleared site_admins array from main site');
    }

    // Show remaining users for main site
    const remainingUsers = await User.find({ site_id: mainSite._id });
    console.log(`\nRemaining users for main site: ${remainingUsers.length}`);
    for (const user of remainingUsers) {
      console.log(`- ${user.email} - Role: ${user.role}`);
    }

    // Show all super_admin users
    const superAdmins = await User.find({ role: 'super_admin' });
    console.log(`\nSuper admins in system: ${superAdmins.length}`);
    for (const admin of superAdmins) {
      console.log(`- ${admin.email} (Site: ${admin.site_id || 'No site'})`);
    }

    console.log('\n✅ Site admin cleanup completed successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
fixSiteAdmins();
