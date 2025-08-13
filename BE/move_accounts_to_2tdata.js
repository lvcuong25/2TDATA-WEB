import mongoose from 'mongoose';
import User from './src/model/User.js';
import Site from './src/model/Site.js';
import dotenv from 'dotenv';

dotenv.config();

async function moveAccountsTo2TData() {
    try {
        await mongoose.connect(process.env.DB_URI || process.env.DATABASE_URL);
        console.log('🔗 Connected to MongoDB');

        // Find 2T DATA site
        const twoTDataSite = await Site.findById('686d45a89a0a0c37366567c8');
        if (!twoTDataSite) {
            console.error('❌ 2T DATA site not found');
            return;
        }
        
        console.log(`✅ Found 2T DATA site: ${twoTDataSite.name}`);
        console.log(`   Domains: ${twoTDataSite.domains.join(', ')}`);

        // Find all demo accounts
        const demoAccounts = await User.find({
            email: { $regex: /^khachhang\.demo\d{2}@gmail\.com$/ }
        }).sort({ email: 1 });

        console.log(`\n📊 Found ${demoAccounts.length} demo accounts`);

        // Update each account to 2T DATA site
        const updateResults = [];
        
        for (const account of demoAccounts) {
            const result = await User.findByIdAndUpdate(
                account._id,
                { site_id: twoTDataSite._id },
                { new: true }
            );
            
            updateResults.push({
                email: result.email,
                name: result.name,
                oldSiteId: account.site_id,
                newSiteId: result.site_id
            });
            
            console.log(`✅ Updated: ${result.email} -> 2T DATA site`);
        }

        console.log('\n🎉 Account migration completed!');
        console.log(`📊 Total migrated: ${updateResults.length} accounts`);
        console.log('\n📝 Migration Summary:');
        console.log('==================');
        updateResults.forEach((result, index) => {
            console.log(`${index + 1}. ${result.email} - ${result.name}`);
        });
        console.log(`\n🏢 All accounts now belong to: ${twoTDataSite.name}`);
        console.log(`🌐 Site domains: ${twoTDataSite.domains.join(', ')}`);
        
    } catch (error) {
        console.error('❌ Error migrating accounts:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
    }
}

moveAccountsTo2TData();
