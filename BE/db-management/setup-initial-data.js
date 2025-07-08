#!/usr/bin/env node

/**
 * Initial Data Setup Script
 * Creates the main site and super admin user for the application
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.production' });

// Import models (adjust paths as needed)
import Site from '../src/model/Site.js';
import User from '../src/model/User.js';

// Main site configuration
const MAIN_SITE = {
  name: "Main Site",
  domains: ["trunglq8.com", "www.trunglq8.com"],
  status: "active",
  settings: {
    theme: "default",
    features: ["auth", "dashboard", "reports", "admin"],
    branding: {
      name: "2TDATA",
      logo: null
    }
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

// Super admin user configuration
const SUPER_ADMIN = {
  email: "admin@2tdata.com",
  username: "superadmin",
  password: "admin123", // Will be hashed
  firstName: "Super",
  lastName: "Admin",
  role: "superadmin",
  status: "active",
  verified: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

async function setupInitialData() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Connected to MongoDB');

    // Create main site
    console.log('🔄 Setting up main site...');
    
    // Check if main site already exists
    const existingSite = await Site.findOne({ 
      domains: { $in: MAIN_SITE.domains } 
    });
    
    let mainSite;
    if (existingSite) {
      console.log('ℹ️ Main site already exists, updating...');
      mainSite = await Site.findByIdAndUpdate(
        existingSite._id,
        MAIN_SITE,
        { new: true }
      );
    } else {
      console.log('🔄 Creating main site...');
      mainSite = await Site.create(MAIN_SITE);
    }
    
    console.log(`✅ Main site ready: ${mainSite.name} (${mainSite.domains.join(', ')})`);

    // Create super admin user
    console.log('🔄 Setting up super admin user...');
    
    // Check if super admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: SUPER_ADMIN.email },
        { username: SUPER_ADMIN.username }
      ]
    });
    
    if (existingAdmin) {
      console.log('ℹ️ Super admin user already exists, updating password...');
      const hashedPassword = await bcryptjs.hash(SUPER_ADMIN.password, 12);
      await User.findByIdAndUpdate(existingAdmin._id, {
        password: hashedPassword,
        role: "superadmin",
        status: "active",
        verified: true,
        siteId: mainSite._id,
        updatedAt: new Date()
      });
    } else {
      console.log('🔄 Creating super admin user...');
      const hashedPassword = await bcryptjs.hash(SUPER_ADMIN.password, 12);
      await User.create({
        ...SUPER_ADMIN,
        password: hashedPassword,
        siteId: mainSite._id
      });
    }
    
    console.log(`✅ Super admin ready: ${SUPER_ADMIN.email} / ${SUPER_ADMIN.password}`);

    console.log('\n🎉 Initial data setup complete!');
    console.log('\n📋 Summary:');
    console.log(`🌐 Main Site: ${mainSite.domains.join(', ')}`);
    console.log(`👤 Super Admin: ${SUPER_ADMIN.email}`);
    console.log(`🔑 Password: ${SUPER_ADMIN.password}`);
    console.log(`🔗 Login URL: http://trunglq8.com/login`);
    
    console.log('\n✅ You can now test the login functionality!');

  } catch (error) {
    console.error('❌ Failed to setup initial data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

setupInitialData();
