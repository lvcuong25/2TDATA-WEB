import mongoose from "mongoose";
import Iframe from "./src/model/Iframe.js";
import Site from "./src/model/Site.js";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const migrate = async () => {
  try {
    const iframes = await Iframe.find({ site_id: { $exists: false } });

    for (const iframe of iframes) {
      const site = await Site.findOne({}) // Adjust site selection logic as necessary
      
      if (site) {
        iframe.site_id = site._id;
        await iframe.save();
        console.log(`Updated iframe ${iframe._id} with site_id ${site._id}`);
      } else {
        console.warn(`No site found for iframe ${iframe._id}, please assign site manually if needed.`);
      }
    }

    console.log("Migration completed");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    mongoose.connection.close();
  }
};

migrate();
