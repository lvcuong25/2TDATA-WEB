import mongoose from 'mongoose';
import Site from './src/model/Site.js';

async function debug() {
  try {
    const dbUri = 'mongodb://admin:password@mongodb-dev:27017/2tdata-web?authSource=admin';
    await mongoose.connect(dbUri);
    console.log('✅ Connected to database');
    
    // Check site1.localhost site using static method
    const site1 = await Site.findByDomain('site1.localhost');
    console.log('site1.localhost result:', site1 ? site1.name + ' - ' + site1.domains : 'NOT FOUND');
    
    // Check all sites
    const allSites = await Site.find({});
    console.log('All sites in database:');
    allSites.forEach(site => {
      console.log('- Name:', site.name, 'Domains:', site.domains, 'Status:', site.status);
    });
    
    // Manual query
    const manual = await Site.findOne({ domains: { $in: ['site1.localhost'] }, status: 'active' });
    console.log('Manual query result:', manual ? manual.name : 'NOT FOUND');
    
    // Test different variations
    const variations = ['site1.localhost', 'localhost', 'Site1.localhost'];
    for (const domain of variations) {
      const result = await Site.findByDomain(domain);
      console.log(`Domain "${domain}":`, result ? result.name : 'NOT FOUND');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debug();
