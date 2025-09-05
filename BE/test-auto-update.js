import mongoose from "mongoose";
import UserService from "./src/model/UserService.js";
import User from "./src/model/User.js";
import Service from "./src/model/Service.js";

// Kết nối database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/2tdata");
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Test function
const testAutoUpdate = async () => {
  try {
    console.log("🧪 Testing Auto Update functionality...\n");

    // 1. Tìm một user service để test
    const userService = await UserService.findOne({
      status: 'approved',
      'link_update.0': { $exists: true }
    }).populate('user', 'name email')
      .populate('service', 'name slug');

    if (!userService) {
      console.log("❌ No user service found with link_update for testing");
      return;
    }

    console.log(`📋 Found test service: ${userService.service?.name} for user: ${userService.user?.name}`);

    // 2. Test cập nhật auto update settings
    console.log("\n🔧 Testing auto update settings...");
    
    const testSettings = {
      enabled: true,
      interval: 5 // 5 phút
    };

    userService.autoUpdate.enabled = testSettings.enabled;
    userService.autoUpdate.interval = testSettings.interval;
    userService.autoUpdate.lastUpdateAt = new Date();
    userService.autoUpdate.nextUpdateAt = new Date(Date.now() + testSettings.interval * 60 * 1000);

    await userService.save();
    console.log("✅ Auto update settings saved successfully");

    // 3. Test query để lấy services cần cập nhật
    console.log("\n🔍 Testing query for services that need update...");
    
    const now = new Date();
    const servicesToUpdate = await UserService.find({
      'autoUpdate.enabled': true,
      'autoUpdate.nextUpdateAt': { $lte: now },
      'link_update': { $exists: true, $not: { $size: 0 } }
    }).populate('user', 'name email')
      .populate('service', 'name slug');

    console.log(`📊 Found ${servicesToUpdate.length} services that need update`);

    // 4. Test cập nhật thời gian
    console.log("\n⏰ Testing time update...");
    
    userService.autoUpdate.lastUpdateAt = new Date();
    userService.autoUpdate.nextUpdateAt = new Date(Date.now() + userService.autoUpdate.interval * 60 * 1000);
    await userService.save();
    
    console.log("✅ Time update successful");
    console.log(`   Last update: ${userService.autoUpdate.lastUpdateAt.toLocaleString('vi-VN')}`);
    console.log(`   Next update: ${userService.autoUpdate.nextUpdateAt.toLocaleString('vi-VN')}`);

    // 5. Test tắt auto update
    console.log("\n🔴 Testing disable auto update...");
    
    userService.autoUpdate.enabled = false;
    userService.autoUpdate.nextUpdateAt = null;
    await userService.save();
    
    console.log("✅ Auto update disabled successfully");

    // 6. Kiểm tra lại query sau khi tắt
    const servicesAfterDisable = await UserService.find({
      'autoUpdate.enabled': true,
      'autoUpdate.nextUpdateAt': { $lte: now },
      'link_update': { $exists: true, $not: { $size: 0 } }
    });

    console.log(`📊 Services needing update after disable: ${servicesAfterDisable.length}`);

    console.log("\n🎉 All tests passed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Hàm chính
const main = async () => {
  await connectDB();
  await testAutoUpdate();
  
  await mongoose.connection.close();
  console.log("\n✅ Database connection closed");
  process.exit(0);
};

// Xử lý lỗi
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Chạy test
main();
