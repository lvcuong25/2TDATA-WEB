import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/model/User.js';
import Site from './src/model/Site.js';
import dotenv from 'dotenv';

dotenv.config();

const hashPassword = (password) => bcrypt.hashSync(password, 10);

async function createDemoAccounts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DB_URI || process.env.DATABASE_URL);
        console.log('🔗 Connected to MongoDB');

        // Find a site to assign users to (get the first active site)
        const site = await Site.findOne({ status: 'active' }).sort({ createdAt: 1 });
        if (!site) {
            console.error('❌ No active site found. Creating users without site assignment.');
        } else {
            console.log(`✅ Found site: ${site.name} (${site._id})`);
        }

        const demoAccounts = [];
        
        // Generate 20 demo accounts
        for (let i = 1; i <= 20; i++) {
            const paddedNumber = i.toString().padStart(2, '0');
            const email = `khachhang.demo${paddedNumber}@gmail.com`;
            const name = `Khách Hàng Demo ${paddedNumber}`;
            
            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                console.log(`⚠️  User ${email} already exists, skipping...`);
                continue;
            }

            const userData = {
                email: email,
                name: name,
                password: hashPassword('123456'),
                role: 'member',
                phone: `090123${paddedNumber.padStart(4, '0')}`,
                address: `Địa chỉ demo ${i}, Thành phố HCM`,
                age: 25 + (i % 30), // Ages between 25-54
                active: true,
                site_id: site ? site._id : null,
                termsAcceptance: {
                    agreeTermsOfService: true,
                    agreeDataPolicy: true,
                    agreeSecurityPolicy: true,
                    acceptedAt: new Date()
                },
                service: [],
                information: []
            };

            const newUser = await User.create(userData);
            demoAccounts.push({
                id: newUser._id,
                email: newUser.email,
                name: newUser.name
            });
            
            console.log(`✅ Created user: ${email} (${newUser._id})`);
        }

        console.log('\n🎉 Demo account creation completed!');
        console.log(`📊 Total created: ${demoAccounts.length} accounts`);
        console.log('\n📝 Account Details:');
        console.log('==================');
        demoAccounts.forEach((account, index) => {
            console.log(`${index + 1}. ${account.email} - ${account.name}`);
        });
        console.log('\n🔑 All passwords: 123456');
        console.log('👤 All roles: member');
        
    } catch (error) {
        console.error('❌ Error creating demo accounts:', error);
        console.error('Error details:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

createDemoAccounts();
