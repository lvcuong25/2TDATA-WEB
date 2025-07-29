import mongoose from "mongoose";
import OrganizationService from "../src/model/OrganizationService.js";
import dotenv from "dotenv";

dotenv.config();

const migrateOrganizationServiceLinks = async () => {
  try {
    // Kết nối đến MongoDB
    await mongoose.connect(process.env.MONGODB_URL || "mongodb://localhost:27017/org-multi-tenant");
    console.log("Connected to MongoDB");

    // Tìm tất cả OrganizationService chưa có trường link hoặc link_update
    const orgServices = await OrganizationService.find({
      $or: [
        { link: { $exists: false } },
        { link_update: { $exists: false } }
      ]
    });

    console.log(`Found ${orgServices.length} organization services to update`);

    // Cập nhật từng document
    for (const orgService of orgServices) {
      const updateData = {};
      
      // Thêm mảng link rỗng nếu chưa có
      if (!orgService.link) {
        updateData.link = [];
      }
      
      // Thêm mảng link_update rỗng nếu chưa có
      if (!orgService.link_update) {
        updateData.link_update = [];
      }

      if (Object.keys(updateData).length > 0) {
        await OrganizationService.findByIdAndUpdate(
          orgService._id,
          { $set: updateData },
          { new: true }
        );
        console.log(`Updated organization service: ${orgService._id}`);
      }
    }

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

// Chạy migration
migrateOrganizationServiceLinks();
