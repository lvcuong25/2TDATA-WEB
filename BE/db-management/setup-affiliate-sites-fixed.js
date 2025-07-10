import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Import models
import User from './src/model/User.js';
import Site from './src/model/Site.js';
import Service from './src/model/Service.js';
import Blog from './src/model/Blog.js';
import UserService from './src/model/UserService.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://admin:password@2tdata-mongodb:27017/2TDATA?authSource=admin';

/**
 * Setup complete affiliate site architecture
 */
const setupAffiliateSites = async () => {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if we should force setup
    const forceSetup = process.argv.includes('--force');
    const existingSites = await Site.countDocuments();
    
    console.log(`Found ${existingSites} existing sites`);
    
    if (existingSites > 0 && !forceSetup) {
      console.log('Sites already exist. Use --force to recreate them.');
      return;
    }

    // If force setup, clear existing sites to avoid domain conflicts
    if (forceSetup && existingSites > 0) {
      console.log('🧹 Clearing existing data...');
      await Site.deleteMany({});
      await User.deleteMany({});
      await Service.deleteMany({});
      console.log('✅ Data cleared');
    }

    // 1. Create Master/Main Site (2TDATA)
    console.log('🏗️  Creating master site...');
    const masterSite = new Site({
      name: '2TDATA - Master Platform',
      domains: ['2tdata.com', 'www.2tdata.com', 'localhost'],
      theme_config: {
        primaryColor: '#2563EB',
        secondaryColor: '#1E293B',
        layout: 'modern',
        logoUrl: '/assets/logos/2tdata-logo.png'
      },
      status: 'active',
      is_main_site: true,
      settings: {
        allowRegistration: true,
        requireEmailVerification: true,
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
    console.log('✅ Master site created');

    // 2. Create Affiliate Sites
    console.log('🏗️  Creating affiliate sites...');
    const affiliateSites = [
      {
        name: 'TechHub Affiliate',
        domains: ['techhub.2tdata.com', 'techhub.localhost', 'site1.localhost', 'partner-tech.2tdata.com'],
        theme_config: {
          primaryColor: '#10B981',
          secondaryColor: '#065F46',
          layout: 'default',
          logoUrl: '/assets/logos/techhub-logo.png'
        },
        category: 'technology',
        description: 'Technology focused affiliate site'
      },
      {
        name: 'FinanceFlow Affiliate',
        domains: ['finance.2tdata.com', 'finance.localhost', 'site2.localhost', 'partner-finance.2tdata.com'],
        theme_config: {
          primaryColor: '#F59E0B',
          secondaryColor: '#92400E',
          layout: 'classic',
          logoUrl: '/assets/logos/finance-logo.png'
        },
        category: 'finance',
        description: 'Financial services affiliate site'
      },
      {
        name: 'HealthCore Affiliate',
        domains: ['health.2tdata.com', 'health.localhost', 'site3.localhost', 'partner-health.2tdata.com'],
        theme_config: {
          primaryColor: '#EF4444',
          secondaryColor: '#B91C1C',
          layout: 'modern',
          logoUrl: '/assets/logos/health-logo.png'
        },
        category: 'healthcare',
        description: 'Healthcare focused affiliate site'
      },
      {
        name: 'EduPlatform Affiliate',
        domains: ['edu.2tdata.com', 'education.localhost', 'site4.localhost', 'partner-edu.2tdata.com'],
        theme_config: {
          primaryColor: '#8B5CF6',
          secondaryColor: '#6D28D9',
          layout: 'default',
          logoUrl: '/assets/logos/edu-logo.png'
        },
        category: 'education',
        description: 'Educational services affiliate site'
      },
      {
        name: 'GameZone Affiliate',
        domains: ['games.2tdata.com', 'gaming.localhost', 'site5.localhost', 'partner-games.2tdata.com'],
        theme_config: {
          primaryColor: '#EC4899',
          secondaryColor: '#BE185D',
          layout: 'modern',
          logoUrl: '/assets/logos/games-logo.png'
        },
        category: 'gaming',
        description: 'Gaming and entertainment affiliate site'
      }
    ];

    const createdAffiliateSites = [];
    for (const siteData of affiliateSites) {
      const site = new Site({
        name: siteData.name,
        domains: siteData.domains,
        theme_config: siteData.theme_config,
        status: 'active',
        settings: {
          allowRegistration: true,
          requireEmailVerification: false,
          timezone: 'UTC',
          language: 'en',
          maxUsers: 10000
        }
      });
      
      // Store category as a custom property for service creation
      site.category = siteData.category;
      site.description = siteData.description;

      await site.save();
      createdAffiliateSites.push(site);
      console.log(`✅ Created affiliate site: ${site.name}`);
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
      // Note: super_admin doesn't need site_id - can access all sites
    });

    await superAdmin.save();
    console.log('✅ Super admin created');

    // 4. Create Site Admins for each affiliate site
    console.log('👨‍💼 Creating site admins...');
    const siteAdmins = [];
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
      siteAdmins.push(siteAdmin);

      // Add admin to site's admin list
      site.site_admins.push({
        user_id: siteAdmin._id,
        role: 'site_admin',
        permissions: ['manage_users', 'manage_content', 'manage_settings', 'view_analytics']
      });
      await site.save();
      console.log(`✅ Created site admin for: ${site.name}`);
    }

    // 5. Create Sample Users for each affiliate site
    console.log('👥 Creating sample users...');
    for (let i = 0; i < createdAffiliateSites.length; i++) {
      const site = createdAffiliateSites[i];
      const userPassword = await bcrypt.hash('user123', 12);

      // Create 3 sample users per site
      for (let j = 1; j <= 3; j++) {
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
      console.log(`✅ Created 3 sample users for: ${site.name}`);
    }

    // 6. Update site statistics
    console.log('📊 Updating site statistics...');
    for (const site of [masterSite, ...createdAffiliateSites]) {
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

    // Display summary
    console.log('\n🎉 Setup completed successfully!');
    console.log('=================================');
    console.log(`✅ Created 1 master site: ${masterSite.name}`);
    console.log(`✅ Created ${createdAffiliateSites.length} affiliate sites`);
    console.log(`✅ Created 1 super admin`);
    console.log(`✅ Created ${siteAdmins.length} site admins`);
    console.log(`✅ Created ${createdAffiliateSites.length * 3} sample users`);
    
    console.log('\n🌐 Available domains:');
    for (const site of [masterSite, ...createdAffiliateSites]) {
      console.log(`- ${site.name}: ${site.domains.join(', ')}`);
    }
    
    console.log('\n🔑 Login credentials:');
    console.log('- Super Admin: superadmin@2tdata.com / admin123');
    for (const site of createdAffiliateSites) {
      console.log(`- ${site.name} Admin: admin@${site.domains[0]} / siteadmin123`);
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

// Run the setup
setupAffiliateSites()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Affiliate sites setup failed:', error);
    process.exit(1);
  });
