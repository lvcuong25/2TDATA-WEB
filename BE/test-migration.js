// Test Migration Script (ES Module version)
// Run on VPS Production với database 2TDATA_TEST

import mongoose from 'mongoose';

async function testMigration() {
    try {
        // Connect to test database
        await mongoose.connect('mongodb://localhost:27017/2TDATA_TEST');
        console.log('Connected to 2TDATA_TEST database');

        const db = mongoose.connection.db;

        // 1. Create default site for dev.2tdata.com
        console.log('\n1. Creating default site...');
        const sitesCollection = db.collection('sites');
        
        // Check if site already exists
        const existingSite = await sitesCollection.findOne({ domains: 'dev.2tdata.com' });
        let siteId;
        
        if (existingSite) {
            siteId = existingSite._id;
            console.log(`Site already exists with ID: ${siteId}`);
        } else {
            const defaultSite = await sitesCollection.insertOne({
                name: "Dev Test Site",
                domains: ["dev.2tdata.com"],
                status: "active",
                settings: {
                    allowRegistration: true,
                    language: "vi",
                    timezone: "Asia/Ho_Chi_Minh"
                },
                createdAt: new Date()
            });
            siteId = defaultSite.insertedId;
            console.log(`Created site with ID: ${siteId}`);
        }

        // 2. Update user roles
        console.log('\n2. Updating user roles...');
        const usersCollection = db.collection('users');
        
        // admin -> super_admin
        const adminUpdate = await usersCollection.updateMany(
            { role: 'admin' },
            { $set: { role: 'super_admin' } }
        );
        console.log(`Updated ${adminUpdate.modifiedCount} admin users to super_admin`);

        // user/null -> member
        const userUpdate = await usersCollection.updateMany(
            { role: { $in: ['user', null] } },
            { $set: { role: 'member' } }
        );
        console.log(`Updated ${userUpdate.modifiedCount} users to member`);

        // Add missing fields
        await usersCollection.updateMany(
            { username: { $exists: false } },
            [{ 
                $set: { 
                    username: { $arrayElemAt: [{ $split: ["$email", "@"] }, 0] },
                    status: 'active',
                    verified: true,
                    site_id: siteId
                } 
            }]
        );

        // 3. Update services
        console.log('\n3. Updating services...');
        const servicesCollection = db.collection('services');
        const serviceUpdate = await servicesCollection.updateMany(
            { status: { $exists: false } },
            { 
                $set: { 
                    status: 'active',
                    site_id: siteId,
                    authorizedLinks: []
                } 
            }
        );
        console.log(`Updated ${serviceUpdate.modifiedCount} services`);

        // 4. Update userservices
        console.log('\n4. Updating userservices...');
        const userservicesCollection = db.collection('userservices');
        const userserviceUpdate = await userservicesCollection.updateMany(
            { site_id: { $exists: false } },
            { 
                $set: { 
                    site_id: siteId,
                    status: 'approved',
                    link: [],
                    link_update: []
                } 
            }
        );
        console.log(`Updated ${userserviceUpdate.modifiedCount} userservices`);

        // 5. Verify migration
        console.log('\n5. Verifying migration...');
        const stats = {
            users: await usersCollection.countDocuments(),
            superAdmins: await usersCollection.countDocuments({ role: 'super_admin' }),
            members: await usersCollection.countDocuments({ role: 'member' }),
            services: await servicesCollection.countDocuments(),
            userservices: await userservicesCollection.countDocuments(),
            sites: await sitesCollection.countDocuments()
        };

        console.log('\nMigration completed successfully!');
        console.log('Database stats:', stats);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Run migration
testMigration();
