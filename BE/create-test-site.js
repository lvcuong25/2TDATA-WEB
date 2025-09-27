import mongoose from 'mongoose';
import Site from './src/model/Site.js';

async function createTestSite() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/2TDATA');
    console.log('Connected to MongoDB');

    // Create test site
    const testSite = await Site.create({
      name: "Test Site",
      domains: ["localhost", "127.0.0.1"],
      status: "active"
    });

    console.log('Test site created:', testSite);
    process.exit(0);
  } catch (error) {
    console.error('Error creating test site:', error);
    process.exit(1);
  }
}

createTestSite();
