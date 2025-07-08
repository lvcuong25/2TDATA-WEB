import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../BE/.env') });

async function markMainSite() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/2TDATA';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Import Site model dynamically
    const { default: Site } = await import('../BE/src/model/Site.js');

    // Find main site by its domains
    const mainSite = await Site.findOne({ 
      domains: { $in: ['trunglq8.com', 'www.trunglq8.com'] } 
    });

    if (mainSite) {
      mainSite.is_main_site = true;
      await mainSite.save();
      console.log(`✅ Main site "${mainSite.name}" has been marked as protected from deletion`);
    } else {
      console.log('❌ Main site not found');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

markMainSite();
