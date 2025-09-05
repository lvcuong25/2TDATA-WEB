import mongoose from 'mongoose';
import UserService from './src/model/UserService.js';
import User from './src/model/User.js';
import Service from './src/model/Service.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://admin:password123@localhost:27017/2TDATA?authSource=admin");
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const createTestAutoUpdateService = async () => {
  try {
    console.log("🧪 Creating test auto-update service...\n");

    // 1. Tìm user superadmin
    const superAdmin = await User.findOne({ email: 'superadmin@2tdata.com' });
    if (!superAdmin) {
      console.log("❌ Superadmin user not found");
      return;
    }
    console.log("👤 Found superadmin:", superAdmin.name);

    // 2. Tìm một service bất kỳ
    const service = await Service.findOne({});
    if (!service) {
      console.log("❌ No service found");
      return;
    }
    console.log("🔧 Using service:", service.name);

    // 3. Tạo hoặc update UserService với auto-update
    const now = new Date();
    const nextUpdate = new Date(now.getTime() + 1 * 60 * 1000); // 1 phút sau

    const userServiceData = {
      user: superAdmin._id,
      service: service._id,
      site_id: superAdmin.site_id,
      status: 'approved',
      link_update: [{
        url: 'https://httpbin.org/post',
        title: 'Test Update Link',
        description: 'Test link for auto-update'
      }],
      autoUpdate: {
        enabled: true,
        interval: 1, // 1 phút
        lastUpdateAt: now,
        nextUpdateAt: nextUpdate,
        isUpdating: false
      }
    };

    // Kiểm tra xem đã có UserService này chưa
    let userService = await UserService.findOne({
      user: superAdmin._id,
      service: service._id
    });

    if (userService) {
      // Update existing
      userService.link_update = userServiceData.link_update;
      userService.autoUpdate = userServiceData.autoUpdate;
      userService.status = 'approved';
      await userService.save();
      console.log("📝 Updated existing UserService");
    } else {
      // Create new
      userService = new UserService(userServiceData);
      await userService.save();
      console.log("✨ Created new UserService");
    }

    console.log("📊 Service details:");
    console.log("- ID:", userService._id);
    console.log("- Auto-update enabled:", userService.autoUpdate.enabled);
    console.log("- Interval:", userService.autoUpdate.interval, "minutes");
    console.log("- Next update at:", userService.autoUpdate.nextUpdateAt.toLocaleString('vi-VN'));
    console.log("- Has update links:", userService.link_update.length);

    // 4. Kiểm tra query để đảm bảo service sẽ được pick up
    const servicesNeedingUpdate = await UserService.find({
      'autoUpdate.enabled': true,
      'autoUpdate.nextUpdateAt': { $lte: new Date() },
      'link_update': { $exists: true, $not: { $size: 0 } }
    });

    console.log("\n🔍 Services needing update RIGHT NOW:", servicesNeedingUpdate.length);

    if (servicesNeedingUpdate.length === 0) {
      console.log("⏰ Service will need update at:", userService.autoUpdate.nextUpdateAt.toLocaleString('vi-VN'));
      console.log("🕐 Current time:", new Date().toLocaleString('vi-VN'));
      console.log("⏱️  Time until next update:", Math.round((userService.autoUpdate.nextUpdateAt - new Date()) / 1000), "seconds");
    }

    console.log("\n🎉 Test service created successfully!");
    console.log("💡 Auto-update will run every minute via cron job");

  } catch (error) {
    console.error("❌ Error creating test service:", error);
  }
};

const main = async () => {
  await connectDB();
  await createTestAutoUpdateService();
  await mongoose.connection.close();
  console.log("\n✅ Database connection closed");
  process.exit(0);
};

main().catch(console.error);
