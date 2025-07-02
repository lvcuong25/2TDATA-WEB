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

console.log('🔗 Connecting to MongoDB:', MONGODB_URI.replace(/password@/, '***@'));

/**
 * Seed database with sample data for development
 */
const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if data already exists
    const existingSites = await Site.countDocuments();
    const existingUsers = await User.countDocuments();

    if (existingSites > 0 || existingUsers > 0) {
      console.log('⚠️  Database already contains data.');
      console.log('   Sites:', existingSites);
      console.log('   Users:', existingUsers);
      
      const confirm = process.argv.includes('--force');
      if (!confirm) {
        console.log('   Use --force flag to add data anyway.');
        return;
      }
    }

    console.log('🏗️  Creating seed data...');

    // 1. Create additional sites
    const sites = [
      {
        name: 'Demo Site 1',
        domains: ['demo1.2tdata.com', 'site1.localhost'],
        status: 'active',
        theme_config: {
          primaryColor: '#10B981',
          secondaryColor: '#374151',
          layout: 'default'
        }
      },
      {
        name: 'Demo Site 2',
        domains: ['demo2.2tdata.com', 'site2.localhost'],
        status: 'active',
        theme_config: {
          primaryColor: '#8B5CF6',
          secondaryColor: '#1F2937',
          layout: 'classic'
        }
      }
    ];

    const createdSites = [];
    for (const siteData of sites) {
      const site = new Site(siteData);
      await site.save();
      createdSites.push(site);
      console.log(`   ✅ Created site: ${site.name}`);
    }

    // Get the main site
    let mainSite = await Site.findOne({ domains: { $in: ['localhost:3000', '2tdata.com'] } });
    if (!mainSite) {
      mainSite = new Site({
        name: '2TDATA Main Site',
        domains: ['localhost:3000', '2tdata.com'],
        status: 'active'
      });
      await mainSite.save();
      console.log('   ✅ Created main site');
    }

    // 2. Create sample users for each site
    const users = [
      {
        site_id: mainSite._id,
        email: 'admin@2tdata.com',
        name: 'Main Admin',
        role: 'site_admin',
        phone: '0123456789'
      },
      {
        site_id: mainSite._id,
        email: 'moderator@2tdata.com',
        name: 'Main Moderator',
        role: 'moderator',
        phone: '0123456788'
      },
      {
        site_id: createdSites[0]._id,
        email: 'admin@demo1.com',
        name: 'Demo1 Admin',
        role: 'site_admin',
        phone: '0123456787'
      },
      {
        site_id: createdSites[1]._id,
        email: 'admin@demo2.com',
        name: 'Demo2 Admin',
        role: 'site_admin',
        phone: '0123456786'
      }
    ];

    const defaultPassword = await bcrypt.hash('password123', 12);
    
    for (const userData of users) {
      const user = new User({
        ...userData,
        password: defaultPassword,
        active: true,
        age: Math.floor(Math.random() * 30) + 25,
        address: `Address for ${userData.name}`
      });
      
      await user.save();
      console.log(`   ✅ Created user: ${user.email} (${user.role})`);

      // Add site admins to their respective sites
      if (user.role === 'site_admin') {
        const site = await Site.findById(user.site_id);
        site.site_admins.push({
          user_id: user._id,
          role: 'site_admin',
          permissions: ['manage_users', 'manage_content', 'manage_settings', 'view_analytics']
        });
        await site.save();
      }
    }

    // 3. Create sample services for each site
    const services = [
      {
        site_id: mainSite._id,
        name: 'Main Service 1',
        description: 'Primary service for main site',
        status: 'approved',
        authorizedLinks: [
          { url: 'https://service1.example.com', title: 'Main Service Portal', description: 'Main service access point' }
        ]
      },
      {
        site_id: mainSite._id,
        name: 'Main Service 2',
        description: 'Secondary service for main site',
        status: 'waiting',
        authorizedLinks: [
          { url: 'https://service2.example.com', title: 'Secondary Service', description: 'Additional service features' }
        ]
      },
      {
        site_id: createdSites[0]._id,
        name: 'Demo1 Service',
        description: 'Service for demo site 1',
        status: 'approved',
        authorizedLinks: [
          { url: 'https://demo1.example.com', title: 'Demo1 Portal', description: 'Demo site 1 services' }
        ]
      },
      {
        site_id: createdSites[1]._id,
        name: 'Demo2 Service',
        description: 'Service for demo site 2',
        status: 'rejected',
        rejectedReason: 'Needs security review',
        authorizedLinks: [
          { url: 'https://demo2.example.com', title: 'Demo2 Portal', description: 'Demo site 2 services' }
        ]
      }
    ];

    for (const serviceData of services) {
      const service = new Service(serviceData);
      await service.save();
      console.log(`   ✅ Created service: ${service.name} (${service.status})`);
    }

    // 4. Create sample blog posts (if Blog model exists)
    try {
      const blogPosts = [
        {
          site_id: mainSite._id,
          title: 'Welcome to 2TDATA',
          content: 'This is the first blog post on our platform.',
          status: 'published',
          author: await User.findOne({ email: 'admin@2tdata.com' }).then(u => u._id)
        },
        {
          site_id: createdSites[0]._id,
          title: 'Demo Site 1 Launch',
          content: 'Announcing the launch of our first demo site.',
          status: 'published',
          author: await User.findOne({ email: 'admin@demo1.com' }).then(u => u._id)
        }
      ];

      for (const blogData of blogPosts) {
        const blog = new Blog(blogData);
        await blog.save();
        console.log(`   ✅ Created blog post: ${blog.title}`);
      }
    } catch (error) {
      console.log('   ⚠️  Blog model not available, skipping blog posts');
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   🌍 Sites: ${await Site.countDocuments()}`);
    console.log(`   👥 Users: ${await User.countDocuments()}`);
    console.log(`   🔧 Services: ${await Service.countDocuments()}`);
    
    console.log('\n🔑 Default password for all users: password123');
    console.log('\n📧 Sample accounts:');
    const sampleUsers = await User.find().select('email role site_id').populate('site_id', 'name');
    for (const user of sampleUsers) {
      console.log(`   ${user.email} (${user.role}) - ${user.site_id?.name || 'No Site'}`);
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding
seedData()
  .then(() => {
    console.log('✅ Seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  });
