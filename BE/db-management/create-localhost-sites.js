import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/model/User.js';
import Site from '../src/model/Site.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://admin:password123@mongodb:27017/2TDATA?authSource=admin';

/**
 * Create localhost test sites and users
 */
const createLocalhostSites = async () => {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    
    console.log('🚀 Creating localhost test sites...');
    
    // Define localhost sites
    const localhostSites = [
      {
        name: 'Site 1 Test',
        domains: ['site1.localhost'],
        status: 'active',
        theme_config: {
          primaryColor: '#10B981',
          secondaryColor: '#374151',
          layout: 'default'
        }
      },
      {
        name: 'Site 2 Test',
        domains: ['site2.localhost'],
        status: 'active',
        theme_config: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1F2937',
          layout: 'modern'
        }
      },
      {
        name: 'Affiliate 1 Test',
        domains: ['affiliate1.localhost'],
        status: 'active',
        theme_config: {
          primaryColor: '#8B5CF6',
          secondaryColor: '#374151',
          layout: 'classic'
        }
      },
      {
        name: 'Affiliate 2 Test',
        domains: ['affiliate2.localhost'],
        status: 'active',
        theme_config: {
          primaryColor: '#EF4444',
          secondaryColor: '#1F2937',
          layout: 'classic'
        }
      },
      {
        name: 'Partner Test',
        domains: ['partner.localhost'],
        status: 'active',
        theme_config: {
          primaryColor: '#F59E0B',
          secondaryColor: '#374151',
          layout: 'modern'
        }
      }
    ];

    // Create or update sites
    const createdSites = [];
    for (const siteData of localhostSites) {
      let site = await Site.findOne({ domains: { $in: siteData.domains } });
      
      if (site) {
        // Update existing site
        await Site.updateOne(
          { _id: site._id },
          { $set: siteData }
        );
        console.log(`✅ Updated site: ${siteData.name} (${siteData.domains[0]})`);
        createdSites.push(site);
      } else {
        // Create new site
        site = new Site(siteData);
        await site.save();
        console.log(`✅ Created site: ${siteData.name} (${siteData.domains[0]})`);
        createdSites.push(site);
      }
    }

    // Create test users for each site
    const defaultPassword = await bcrypt.hash('admin123', 12);
    
    const testUsers = [
      // Site 1
      {
        email: 'admin@site1.localhost',
        name: 'Site1 Admin',
        role: 'site_admin',
        domain: 'site1.localhost'
      },
      {
        email: 'user@site1.localhost',
        name: 'Site1 User',
        role: 'member',
        domain: 'site1.localhost'
      },
      // Site 2
      {
        email: 'admin@site2.localhost',
        name: 'Site2 Admin',
        role: 'site_admin',
        domain: 'site2.localhost'
      },
      {
        email: 'user@site2.localhost',
        name: 'Site2 User',
        role: 'member',
        domain: 'site2.localhost'
      },
      // Affiliate 1
      {
        email: 'admin@affiliate1.localhost',
        name: 'Affiliate1 Admin',
        role: 'site_admin',
        domain: 'affiliate1.localhost'
      },
      {
        email: 'user@affiliate1.localhost',
        name: 'Affiliate1 User',
        role: 'member',
        domain: 'affiliate1.localhost'
      },
      // Affiliate 2
      {
        email: 'admin@affiliate2.localhost',
        name: 'Affiliate2 Admin',
        role: 'site_admin',
        domain: 'affiliate2.localhost'
      },
      {
        email: 'user@affiliate2.localhost',
        name: 'Affiliate2 User',
        role: 'member',
        domain: 'affiliate2.localhost'
      },
      // Partner
      {
        email: 'admin@partner.localhost',
        name: 'Partner Admin',
        role: 'site_admin',
        domain: 'partner.localhost'
      },
      {
        email: 'user@partner.localhost',
        name: 'Partner User',
        role: 'member',
        domain: 'partner.localhost'
      }
    ];

    console.log('\n👥 Creating test users...');
    
    // Create users
    for (const userData of testUsers) {
      const site = await Site.findOne({ domains: userData.domain });
      
      if (!site) {
        console.log(`❌ Site not found for domain: ${userData.domain}`);
        continue;
      }

      // Check if user already exists
      let user = await User.findOne({ email: userData.email });
      
      if (user) {
        // Update existing user
        await User.updateOne(
          { email: userData.email },
          {
            $set: {
              password: defaultPassword,
              active: true,
              site_id: site._id,
              role: userData.role,
              name: userData.name
            }
          }
        );
        console.log(`✅ Updated user: ${userData.email}`);
      } else {
        // Create new user
        user = new User({
          email: userData.email,
          password: defaultPassword,
          name: userData.name,
          role: userData.role,
          site_id: site._id,
          active: true,
          phone: `012345678${Math.floor(Math.random() * 10)}`,
          age: Math.floor(Math.random() * 30) + 25,
          address: `Test address for ${userData.name}`
        });
        
        await user.save();
        console.log(`✅ Created user: ${userData.email}`);
      }

      // Add site admin to site if needed
      if (userData.role === 'site_admin') {
        const updatedSite = await Site.findById(site._id);
        const existingAdmin = updatedSite.site_admins.find(admin => 
          admin.user_id.toString() === user._id.toString()
        );
        
        if (!existingAdmin) {
          updatedSite.site_admins.push({
            user_id: user._id,
            role: 'site_admin',
            permissions: ['manage_users', 'manage_content', 'manage_settings', 'view_analytics']
          });
          await updatedSite.save();
          console.log(`✅ Added ${userData.email} as site admin for ${updatedSite.name}`);
        }
      }
    }

    console.log('\n🎉 Localhost test setup completed!');
    console.log('\n📝 Test accounts created:');
    console.log('🔐 Default password for all accounts: admin123');
    console.log('\n📧 Available test accounts:');
    
    const domains = ['site1.localhost', 'site2.localhost', 'affiliate1.localhost', 'affiliate2.localhost', 'partner.localhost'];
    
    for (const domain of domains) {
      console.log(`\n🌐 ${domain}:`);
      console.log(`   👤 admin@${domain} (site_admin)`);
      console.log(`   👤 user@${domain} (member)`);
    }
    
    console.log('\n💡 To use these accounts:');
    console.log('1. Add these lines to your hosts file (C:\\Windows\\System32\\drivers\\etc\\hosts):');
    console.log('   127.0.0.1    site1.localhost');
    console.log('   127.0.0.1    site2.localhost');
    console.log('   127.0.0.1    affiliate1.localhost');
    console.log('   127.0.0.1    affiliate2.localhost');
    console.log('   127.0.0.1    partner.localhost');
    console.log('2. Start your application');
    console.log('3. Access http://[domain]:3000 and login with the test accounts');
    console.log('4. Use superadmin@2tdata.com / admin123 for super admin access');

  } catch (error) {
    console.error('❌ Failed to create localhost sites:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

// Run the creation
createLocalhostSites()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Localhost setup failed:', error);
    process.exit(1);
  });
