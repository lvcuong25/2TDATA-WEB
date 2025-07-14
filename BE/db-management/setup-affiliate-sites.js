import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Import models
import User from '../src/model/User.js';
import Site from '../src/model/Site.js';
import Service from '../src/model/Service.js';
import Blog from '../src/model/Blog.js';
import UserService from '../src/model/UserService.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://admin:password@localhost:27017/2TDATA?authSource=admin';

/**
 * Setup complete affiliate site architecture
 */
const setupAffiliateSites = async () => {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    // Check if we should force setup
    const forceSetup = process.argv.includes('--force');
    const existingSites = await Site.countDocuments();
    
    if (existingSites > 0 && !forceSetup) {
      return;
    }

    // If force setup, clear existing sites to avoid domain conflicts
    if (forceSetup && existingSites > 0) {
      await Site.deleteMany({});
      await User.deleteMany({});
      await Service.deleteMany({});
      }

    // 1. Create Master/Main Site (2TDATA)
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
    // 2. Create Affiliate Sites
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

      await site.save();
      createdAffiliateSites.push(site);
      }

    // 3. Create Super Admin (Global)
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
    // 4. Create Site Admins for each affiliate site
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

      }

    // 5. Create Sample Users for each affiliate site
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

      }

    // 6. Create Category-Specific Services for each affiliate site
    const servicesByCategory = {
      'technology': [
        {
          name: 'Cloud Hosting Services',
          description: 'Professional cloud hosting solutions',
          authorizedLinks: [
            { url: 'https://cloudhost.example.com', title: 'Cloud Dashboard', description: 'Main hosting control panel' },
            { url: 'https://cloudhost.example.com/api', title: 'API Access', description: 'Developer API endpoint' }
          ]
        },
        {
          name: 'Software Development Tools',
          description: 'Development and deployment tools',
          authorizedLinks: [
            { url: 'https://devtools.example.com', title: 'Dev Portal', description: 'Development tools and resources' }
          ]
        }
      ],
      'finance': [
        {
          name: 'Investment Platform',
          description: 'Professional investment and trading platform',
          authorizedLinks: [
            { url: 'https://invest.example.com', title: 'Trading Dashboard', description: 'Real-time trading interface' },
            { url: 'https://invest.example.com/portfolio', title: 'Portfolio Management', description: 'Manage your investments' }
          ]
        },
        {
          name: 'Cryptocurrency Exchange',
          description: 'Secure cryptocurrency trading',
          authorizedLinks: [
            { url: 'https://crypto.example.com', title: 'Crypto Exchange', description: 'Trade cryptocurrencies securely' }
          ]
        }
      ],
      'healthcare': [
        {
          name: 'Telemedicine Platform',
          description: 'Online medical consultation services',
          authorizedLinks: [
            { url: 'https://telehealth.example.com', title: 'Patient Portal', description: 'Schedule and attend appointments' },
            { url: 'https://telehealth.example.com/records', title: 'Medical Records', description: 'Access your health records' }
          ]
        },
        {
          name: 'Health Monitoring Tools',
          description: 'Personal health tracking and monitoring',
          authorizedLinks: [
            { url: 'https://healthtrack.example.com', title: 'Health Dashboard', description: 'Monitor your health metrics' }
          ]
        }
      ],
      'education': [
        {
          name: 'Learning Management System',
          description: 'Comprehensive online learning platform',
          authorizedLinks: [
            { url: 'https://lms.example.com', title: 'Course Portal', description: 'Access your courses and materials' },
            { url: 'https://lms.example.com/library', title: 'Digital Library', description: 'Educational resources and books' }
          ]
        },
        {
          name: 'Certification Programs',
          description: 'Professional certification courses',
          authorizedLinks: [
            { url: 'https://certify.example.com', title: 'Certification Hub', description: 'Professional certification programs' }
          ]
        }
      ],
      'gaming': [
        {
          name: 'Gaming Platform',
          description: 'Multi-player gaming and tournaments',
          authorizedLinks: [
            { url: 'https://gameplatform.example.com', title: 'Game Launcher', description: 'Access games and tournaments' },
            { url: 'https://gameplatform.example.com/leaderboards', title: 'Leaderboards', description: 'View rankings and scores' }
          ]
        },
        {
          name: 'Gaming Community',
          description: 'Social platform for gamers',
          authorizedLinks: [
            { url: 'https://gamecommunity.example.com', title: 'Community Hub', description: 'Connect with other gamers' }
          ]
        }
      ]
    };

    // Create services for each affiliate site
    for (const site of createdAffiliateSites) {
      const category = site.category;
      const services = servicesByCategory[category] || [];
      
      for (const serviceData of services) {
        const service = new Service({
          site_id: site._id,
          name: serviceData.name,
          slug: serviceData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
          description: serviceData.description,
          status: Math.random() > 0.3 ? 'approved' : 'waiting', // 70% approved
          authorizedLinks: serviceData.authorizedLinks,
          approvedBy: site.site_admins[0]?.user_id,
          approvedAt: Math.random() > 0.3 ? new Date() : undefined
        });

        await service.save();
      }

      }

    // 7. Update site statistics
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
    console.log('\n🎉 Affiliate sites setup completed successfully!');
    console.log('='.repeat(50));
    console.log(`📊 Summary:`);
    console.log(`• Master Site: ${masterSite.name}`);
    console.log(`• Affiliate Sites: ${createdAffiliateSites.length}`);
    console.log(`• Total Users: ${await User.countDocuments()}`);
    console.log(`• Total Services: ${await Service.countDocuments()}`);
    console.log('');
    console.log('🏢 Affiliate Sites Created:');
    for (const site of createdAffiliateSites) {
      console.log(`• ${site.name} (${site.domains[0]}) - ${site.category}`);
    }
    console.log('');
    console.log('🔐 Default Login Credentials:');
    console.log('• Super Admin: superadmin@2tdata.com / admin123');
    for (const site of createdAffiliateSites) {
      console.log(`• Site Admin (${site.name}): admin@${site.domains[0]} / siteadmin123`);
    }
    console.log('');
    console.log('✅ You can now access the affiliate sites at:');
    for (const site of createdAffiliateSites) {
      console.log(`• ${site.name}: http://${site.domains[0]}:5173`);
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
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
