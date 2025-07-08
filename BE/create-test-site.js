import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const DB_URI = process.env.DB_URI || 'mongodb://127.0.0.1:27017/2tdata';

async function createTestSite() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(DB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');

    // Define Site schema inline
    const siteSchema = new mongoose.Schema({
      name: { type: String, required: true },
      domains: [String],
      status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
      settings: {
        theme: { type: String, default: 'default' },
        language: { type: String, default: 'en' },
        timezone: { type: String, default: 'UTC' }
      },
      stats: {
        totalUsers: { type: Number, default: 0 },
        activeUsers: { type: Number, default: 0 },
        lastActivity: { type: Date, default: Date.now }
      },
      site_admins: [{
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['site_admin', 'site_moderator'], default: 'site_admin' },
        permissions: [String],
        assigned_at: { type: Date, default: Date.now }
      }]
    }, {
      timestamps: true
    });

    const Site = mongoose.model('Site', siteSchema);

    // Check if main site exists
    const existingSite = await Site.findOne({
      $or: [
        { domains: 'trunglq8.com' },
        { domains: 'localhost' },
        { name: /main|master|2tdata/i }
      ]
    });

    if (existingSite) {
      console.log('✅ Main site already exists:', existingSite.name);
      console.log('   Domains:', existingSite.domains);
      return;
    }

    // Create main site
    const mainSite = new Site({
      name: 'Main Site',
      domains: [
        'trunglq8.com',
        'localhost',
        '127.0.0.1',
        'test.2tdata.com'
      ],
      status: 'active',
      settings: {
        theme: 'default',
        language: 'en',
        timezone: 'UTC'
      },
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        lastActivity: new Date()
      }
    });

    await mainSite.save();
    console.log('✅ Main site created successfully');
    console.log('   Site ID:', mainSite._id);
    console.log('   Domains:', mainSite.domains);

  } catch (error) {
    console.error('❌ Error creating test site:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
}

// Run the script
createTestSite();
