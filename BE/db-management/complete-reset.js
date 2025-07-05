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

);

/**
 * Complete database reset - WARNING: This will delete ALL data
 */
const completeReset = async () => {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    // Drop all collections
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      await collection.drop();
      }

    // 1. Create default site
    const defaultSite = new Site({
      name: '2TDATA Main Site',
      domains: ['localhost', '2tdata.com'],
      status: 'active',
      theme_config: {
        primaryColor: '#3B82F6',
        secondaryColor: '#1F2937',
        layout: 'modern'
      },
      settings: {
        allowRegistration: true,
        requireEmailVerification: false,
        timezone: 'UTC',
        language: 'en',
        maxUsers: 10000
      }
    });

    await defaultSite.save();
    // 2. Create super admin user
    const superAdminPassword = await bcrypt.hash('admin123', 12);
    const superAdmin = new User({
      email: 'superadmin@2tdata.com',
      name: 'Super Administrator',
      password: superAdminPassword,
      role: 'super_admin',
      active: true,
      // Note: super_admin doesn't need site_id
    });

    await superAdmin.save();
    // 3. Create site admin user
    const siteAdminPassword = await bcrypt.hash('siteadmin123', 12);
    const siteAdmin = new User({
      site_id: defaultSite._id,
      email: 'siteadmin@2tdata.com',
      name: 'Site Administrator',
      password: siteAdminPassword,
      role: 'site_admin',
      active: true
    });

    await siteAdmin.save();
    // 4. Add site admin to site's admin list
    defaultSite.site_admins.push({
      user_id: siteAdmin._id,
      role: 'site_admin',
      permissions: ['manage_users', 'manage_content', 'manage_settings', 'view_analytics']
    });
    await defaultSite.save();

    // 5. Create demo regular user
    const userPassword = await bcrypt.hash('user123', 12);
    const demoUser = new User({
      site_id: defaultSite._id,
      email: 'user@2tdata.com',
      name: 'Demo User',
      password: userPassword,
      role: 'member',
      active: true,
      phone: '0123456789',
      address: 'Demo Address',
      age: 25
    });

    await demoUser.save();
    // 6. Create sample service
    const sampleService = new Service({
      site_id: defaultSite._id,
      name: 'Sample Service',
      slug: 'sample-service',
      description: 'This is a sample service for demonstration',
      status: 'approved',
      approvedBy: siteAdmin._id,
      approvedAt: new Date(),
      authorizedLinks: [
        {
          url: 'https://example.com',
          title: 'Example Link',
          description: 'Sample authorized link'
        }
      ]
    });

    await sampleService.save();
    );

  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    }
};

// Run the reset
completeReset()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Reset process failed:', error);
    process.exit(1);
  });
