import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Site from './src/model/Site.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://admin:password@localhost:27017/2TDATA?authSource=admin';

console.log('🔗 Connecting to MongoDB:', MONGODB_URI.replace(/password@/, '***@'));

/**
 * Test site detection logic
 */
const testSiteDetection = async () => {
  try {
    console.log('🧪 Testing site detection logic...');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test hostnames
    const testHostnames = [
      'localhost',
      'site1.localhost',
      'site2.localhost', 
      'site3.localhost',
      'techhub.localhost',
      'finance.localhost',
      'health.localhost',
      'partner-tech.2tdata.com',
      '2tdata.com',
      'nonexistent.localhost'
    ];

    console.log('\n🔍 Testing hostname detection:');
    console.log('=====================================');

    for (const hostname of testHostnames) {
      console.log(`\n🌐 Testing hostname: ${hostname}`);
      
      // Method 1: Direct domain lookup
      let site = await Site.findByDomain(hostname);
      console.log(`   Direct lookup: ${site ? `✅ Found "${site.name}"` : '❌ Not found'}`);
      
      // Method 2: Regex search for localhost patterns
      if (!site && hostname.includes('localhost')) {
        site = await Site.findOne({ 
          domains: { $regex: new RegExp(hostname.replace('.', '\\.'), 'i') },
          status: 'active' 
        });
        console.log(`   Regex lookup: ${site ? `✅ Found "${site.name}"` : '❌ Not found'}`);
      }
      
      // Method 3: Fallback for bare localhost
      if (!site && (hostname === 'localhost' || hostname === '127.0.0.1')) {
        site = await Site.findOne({ 
          $or: [
            { domains: 'localhost' },
            { domains: '2tdata.com' },
            { name: /main|master|2tdata/i }
          ],
          status: 'active' 
        }).sort({ createdAt: 1 });
        console.log(`   Fallback lookup: ${site ? `✅ Found "${site.name}"` : '❌ Not found'}`);
      }
      
      if (site) {
        console.log(`   ✅ Final result: "${site.name}" (${site.domains.join(', ')})`);
      } else {
        console.log(`   ❌ Final result: No site found for "${hostname}"`);
      }
    }

    // List all sites and their domains
    console.log('\n📊 All sites in database:');
    console.log('=====================================');
    const allSites = await Site.find({}, { name: 1, domains: 1, status: 1 });
    
    for (const site of allSites) {
      console.log(`📍 ${site.name}:`);
      console.log(`   Domains: ${site.domains.join(', ')}`);
      console.log(`   Status: ${site.status}`);
    }

    console.log('\n🎯 Setup Instructions for /etc/hosts:');
    console.log('=====================================');
    console.log('Add these entries to your /etc/hosts file (Windows: C:\\Windows\\System32\\drivers\\etc\\hosts):');
    console.log('');
    for (const site of allSites) {
      for (const domain of site.domains) {
        if (domain.includes('localhost') || domain.includes('2tdata.com')) {
          console.log(`127.0.0.1    ${domain}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the test
testSiteDetection()
  .then(() => {
    console.log('✅ Site detection test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Site detection test failed:', error);
    process.exit(1);
  });
