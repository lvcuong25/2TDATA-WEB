import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Site from './src/model/Site.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://admin:password@localhost:27017/2TDATA?authSource=admin';

console.log('🔗 Connecting to MongoDB:', MONGODB_URI.replace(/password@/, '***@'));

/**
 * Debug site detection issue
 */
const debugSiteDetection = async () => {
  try {
    console.log('🐛 Debugging site detection issue...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // List all sites and their exact domains
    console.log('\n📊 All sites in database:');
    console.log('=====================================');
    const allSites = await Site.find({}, { name: 1, domains: 1, status: 1 }).sort({ createdAt: 1 });
    
    for (const site of allSites) {
      console.log(`📍 ${site.name} (${site._id}):`);
      console.log(`   Status: ${site.status}`);
      console.log(`   Domains: [${site.domains.map(d => `"${d}"`).join(', ')}]`);
      
      // Test each domain
      for (const domain of site.domains) {
        const foundSite = await Site.findByDomain(domain);
        console.log(`   Test "${domain}": ${foundSite ? `✅ Found "${foundSite.name}"` : '❌ Not found'}`);
      }
      console.log('');
    }

    // Test specific problematic domains
    const testDomains = ['techhub.localhost', 'site1.localhost', 'localhost'];
    
    console.log('\n🧪 Testing problematic domains:');
    console.log('=====================================');
    
    for (const domain of testDomains) {
      console.log(`\n🔍 Testing domain: "${domain}"`);
      
      // Method 1: findByDomain
      const site1 = await Site.findByDomain(domain);
      console.log(`   findByDomain: ${site1 ? `✅ Found "${site1.name}"` : '❌ Not found'}`);
      
      // Method 2: Direct array search
      const site2 = await Site.findOne({ 
        domains: domain,
        status: 'active' 
      });
      console.log(`   Direct search: ${site2 ? `✅ Found "${site2.name}"` : '❌ Not found'}`);
      
      // Method 3: Array $in search
      const site3 = await Site.findOne({ 
        domains: { $in: [domain] },
        status: 'active' 
      });
      console.log(`   Array $in search: ${site3 ? `✅ Found "${site3.name}"` : '❌ Not found'}`);
      
      // Method 4: Check findByDomain method implementation
      console.log('   🔧 Debugging findByDomain method...');
      try {
        const site4 = await Site.findOne({ 
          domains: { $in: [domain] },
          status: 'active'
        });
        console.log(`   Manual findByDomain logic: ${site4 ? `✅ Found "${site4.name}"` : '❌ Not found'}`);
      } catch (err) {
        console.log(`   Manual findByDomain error: ${err.message}`);
      }
    }

    // Check findByDomain static method
    console.log('\n🔧 Checking Site model static methods:');
    console.log('=====================================');
    console.log('Site.findByDomain exists:', typeof Site.findByDomain === 'function');
    
    if (typeof Site.findByDomain === 'function') {
      console.log('Testing Site.findByDomain with "localhost":');
      const localhostSite = await Site.findByDomain('localhost');
      console.log(`Result: ${localhostSite ? `Found "${localhostSite.name}"` : 'Not found'}`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the debug
debugSiteDetection()
  .then(() => {
    console.log('✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
