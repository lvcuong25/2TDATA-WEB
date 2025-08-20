import mongoose from 'mongoose';
import Site from './src/model/Site.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkSites() {
    try {
        await mongoose.connect(process.env.DB_URI || process.env.DATABASE_URL);
        console.log('🔗 Connected to MongoDB');

        const sites = await Site.find({}).sort({ createdAt: 1 });
        
        console.log('\n📋 Danh sách các site có sẵn:');
        console.log('================================');
        
        sites.forEach((site, index) => {
            console.log(`${index + 1}. Name: ${site.name}`);
            console.log(`   ID: ${site._id}`);
            console.log(`   Domains: ${site.domains.join(', ')}`);
            console.log(`   Status: ${site.status}`);
            console.log(`   Created: ${site.createdAt}`);
            console.log('   ---');
        });
        
        // Find 2T Data site
        const twoTDataSite = sites.find(site => 
            site.name.toLowerCase().includes('2t') || 
            site.name.toLowerCase().includes('2tdata') ||
            site.domains.some(domain => domain.includes('2tdata'))
        );
        
        if (twoTDataSite) {
            console.log('\n🎯 Found 2T Data site:');
            console.log(`   Name: ${twoTDataSite.name}`);
            console.log(`   ID: ${twoTDataSite._id}`);
            console.log(`   Domains: ${twoTDataSite.domains.join(', ')}`);
        } else {
            console.log('\n⚠️  Could not find 2T Data site automatically.');
            console.log('Please check the list above and identify the correct site.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
    }
}

checkSites();
