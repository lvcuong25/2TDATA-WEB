import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// MongoDB connection string - adjust if needed
const DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/2tdata";
const SITE_ID = "686d45a89a0a0c37366567c8"; // 2T DATA site ID

async function migrate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(DATABASE_URL);
    console.log("Connected to MongoDB");

    // Get Iframe model
    const Iframe = mongoose.model('Iframe', new mongoose.Schema({
      site_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
      title: String,
      url: String,
      description: String,
      viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      createdAt: Date
    }));

    // Find all iframes with null site_id
    const iframesWithoutSite = await Iframe.find({ 
      $or: [
        { site_id: null },
        { site_id: { $exists: false } }
      ]
    });

    console.log(`Found ${iframesWithoutSite.length} iframes without site_id`);

    // Update each iframe
    let updateCount = 0;
    for (const iframe of iframesWithoutSite) {
      await Iframe.updateOne(
        { _id: iframe._id },
        { $set: { site_id: SITE_ID } }
      );
      updateCount++;
      console.log(`Updated iframe: ${iframe.title} (${iframe._id})`);
    }

    console.log(`\nMigration completed! Updated ${updateCount} iframes to site 2T DATA`);

  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run migration
migrate();
