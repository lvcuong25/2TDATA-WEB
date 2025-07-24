import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Import models
import User from '../src/model/User.js';
import Site from '../src/model/Site.js';
import Service from '../src/model/Service.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://admin:password123@mongodb:27017/2TDATA?authSource=admin';

/**
 * Setup complete affiliate site architecture
 */
const setupAffiliateSites = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if we should force setup
    const forceSetup = process.argv.includes('--force');
    const existingSites = await Site.countDocuments();
    
    if (existingSites > 0 && !forceSetup) {
      console.log('📊 Sites already exist. Use --force to reset');
      return;
    }

    // If force setup, clear existing data
    if (forceSetup && existingSites > 0) {
      console.log('🧹 Clearing existing data...');
      await Site.deleteMany({});
      await User.deleteMany({});
      await Service.deleteMany({});
    }

    // 1. Create Master/Main Site (2TDATA)
    console.log('🏗️ Creating main site...');
    const masterSite = new Site({
      name: '2TDATA - Master Platform',
      domains: ['2tdata.com', 'www.2tdata.com', 'localhost'],
      theme_config: {
        primaryColor: '#2563EB',
        secondaryColor: '#1E293B',
        layout: 'modern'
      },
      status: 'active',
      is_main_site: true,
      settings: {
        allowRegistration: true,
        requireEmailVerification: false,
        timezone: 'UTC',
        language: 'en',
        maxUsers: 100000
      },
      stats: {
        totalUsers: 0,
        totalContent: 0,
        lastActivity: new Date()
      }
    });

    await masterSite.save();
    console.log('✅ Main site created');

    // 2. Create Affiliate Sites
    console.log('🏢 Creating affiliate sites...');
    const affiliateSites = [
      {
        name: 'TechHub Affiliate',
        domains: ['techhub.2tdata.com', 'techhub.localhost', 'site1.localhost'],
        theme_config: {
          primaryColor: '#10B981',
          secondaryColor: '#065F46',
          layout: 'default'
        },
        category: 'technology'
      },
      {
        name: 'FinanceFlow Affiliate',
        domains: ['finance.2tdata.com', 'finance.localhost', 'site2.localhost'],
        theme_config: {
          primaryColor: '#F59E0B',
          secondaryColor: '#92400E',
          layout: 'classic'
        },
        category: 'finance'
      }
    ];

    const createdAffiliateSites = [];
    for (const siteData of affiliateSites) {
      const site = new Site({
        name: siteData.name,
        domains: siteData.domains,
        theme_config: siteData.theme_config,
        status: 'active',
        is_main_site: false,
        settings: {
          allowRegistration: true,
          requireEmailVerification: false,
          timezone: 'UTC',
          language: 'en',
          maxUsers: 10000
        }
      });
      
      await site.save();
      createdAffiliateSites.push(site);
      console.log(`✅ Created ${site.name}`);
    }

    // 3. Create Super Admin (Global)
    console.log('👑 Creating super admin...');
    const superAdminPassword = await bcrypt.hash('admin123', 12);
    const superAdmin = new User({
      email: 'superadmin@2tdata.com',
      name: 'Super Administrator',
      password: superAdminPassword,
      role: 'super_admin',
      active: true
    });

    await superAdmin.save();
    console.log('✅ Super admin created');

    // 4. Create Site Admins for each affiliate site
    console.log('👨‍💼 Creating site admins...');
    for (let i = 0; i < createdAffiliateSites.length; i++) {
      const site = createdAffiliateSites[i];
      const adminPassword = await bcrypt.hash('siteadmin123', 12);
      
      const siteAdmin = new User({
        site_id: site._id,
        email: `admin@${site.domains[0]}`,
        name: `${site.name} Administrator`,
        password: adminPassword,
        role: 'site_admin',
        active: true,
        phone: `012345678${i}`,
        address: `Office for ${site.name}`
      });

      await siteAdmin.save();

      // Add admin to site's admin list
      site.site_admins.push({
        user_id: siteAdmin._id,
        role: 'site_admin',
        permissions: ['manage_users', 'manage_content', 'manage_settings', 'view_analytics']
      });
      await site.save();
      
      console.log(`✅ Created admin for ${site.name}: ${siteAdmin.email}`);
    }

    // 5. Create Sample Users
    console.log('👥 Creating sample users...');
    for (let i = 0; i < createdAffiliateSites.length; i++) {
      const site = createdAffiliateSites[i];
      const userPassword = await bcrypt.hash('user123', 12);

      // Create 2 sample users per site
      for (let j = 1; j <= 2; j++) {
        const user = new User({
          site_id: site._id,
          email: `user${j}@${site.domains[0]}`,
          name: `${site.name} User ${j}`,
          password: userPassword,
          role: 'member',
          active: true,
          phone: `098765432${i}${j}`,
          age: 20 + (i * 5) + j,
          address: `User ${j} address for ${site.name}`
        });

        await user.save();
      }
      console.log(`✅ Created users for ${site.name}`);
    }

    // 6. Update site statistics
    console.log('📊 Updating site statistics...');
    for (const site of [masterSite, ...createdAffiliateSites]) {
      const userCount = await User.countDocuments({ site_id: site._id });
      
      await Site.updateOne(
        { _id: site._id },
        {
          'stats.totalUsers': userCount,
          'stats.totalContent': 0,
          'stats.lastActivity': new Date()
        }
      );
    }

    // Display summary
    console.log('\n🎉 Setup completed successfully!');
    console.log('═══════════════════════════════════════');
    console.log('📊 Summary:');
    console.log(`   • Main Site: ${masterSite.name}`);
    console.log(`   • Affiliate Sites: ${createdAffiliateSites.length}`);
    console.log(`   • Total Users: ${await User.countDocuments()}`);
    console.log('\n🔐 Login Information:');
    console.log('   • Super Admin: superadmin@2tdata.com / admin123');
    
    for (const site of createdAffiliateSites) {
      console.log(`   • ${site.name}: admin@${site.domains[0]} / siteadmin123`);
    }
    
    console.log('\n🌐 Access URLs:');
    console.log(`   • Main Site: http://localhost:5173`);
    for (const site of createdAffiliateSites) {
      console.log(`   • ${site.name}: http://${site.domains[1]}:5173`);
    }
    
    console.log('\n💡 Note: Add these to your hosts file:');
    for (const site of createdAffiliateSites) {
      console.log(`   127.0.0.1 ${site.domains[1]}`);
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
};

// Run the setup
setupAffiliateSites()
  .then(() => {
    console.log('✅ Process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Affiliate sites setup failed:', error);
    process.exit(1);
  });
