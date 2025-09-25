import mongoose from "mongoose";
import UserService from "../model/UserService.js";

// Hàm tính thời gian cập nhật tiếp theo cho schedule
const calculateNextScheduleTime = (scheduleType, scheduleTime, scheduleDate, scheduleDays) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Parse thời gian từ string "HH:mm"
  const [hours, minutes] = scheduleTime.split(':').map(Number);
  const scheduleDateTime = new Date(today.getTime() + hours * 60 * 60 * 1000 + minutes * 60 * 1000);
  
  switch (scheduleType) {
    case 'daily':
      // Hàng ngày - nếu thời gian đã qua hôm nay, chuyển sang ngày mai
      if (scheduleDateTime <= now) {
        scheduleDateTime.setDate(scheduleDateTime.getDate() + 1);
      }
      return scheduleDateTime;
      
    case 'weekly':
      // Hàng tuần - tìm ngày tiếp theo trong tuần
      const targetDays = scheduleDays || [1]; // Mặc định thứ 2
      const currentDay = now.getDay(); // 0=CN, 1=T2, ..., 6=T7
      
      // Tìm ngày gần nhất trong tuần
      let nextDay = null;
      for (let i = 0; i < 7; i++) {
        const checkDay = (currentDay + i) % 7;
        if (targetDays.includes(checkDay)) {
          nextDay = checkDay;
          break;
        }
      }
      
      if (nextDay !== null) {
        const daysToAdd = (nextDay - currentDay + 7) % 7;
        scheduleDateTime.setDate(scheduleDateTime.getDate() + daysToAdd);
        
        // Nếu thời gian đã qua hôm nay và là cùng ngày, chuyển sang tuần sau
        if (daysToAdd === 0 && scheduleDateTime <= now) {
          scheduleDateTime.setDate(scheduleDateTime.getDate() + 7);
        }
      }
      return scheduleDateTime;
      
    case 'monthly':
      // Hàng tháng - chuyển sang tháng sau
      scheduleDateTime.setMonth(scheduleDateTime.getMonth() + 1);
      return scheduleDateTime;
      
    case 'once':
      // Một lần - sử dụng scheduleDate
      if (scheduleDate) {
        const onceDate = new Date(scheduleDate);
        onceDate.setHours(hours, minutes, 0, 0);
        return onceDate;
      }
      return scheduleDateTime;
      
    default:
      return scheduleDateTime;
  }
};

// Kết nối database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/2tdata");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Hàm thực hiện cập nhật tự động
const performAutoUpdate = async () => {
  try {
    console.log("Starting auto update process...");
    
    // Lấy danh sách service cần cập nhật trực tiếp từ database
    const now = new Date();
    const servicesToUpdate = await UserService.find({
      'autoUpdate.enabled': true,
      'autoUpdate.nextUpdateAt': { $lte: now },
      'link_update': { $exists: true, $not: { $size: 0 } }
    }).populate('user', 'name email')
      .populate('service', 'name slug');
    
    console.log(`Found ${servicesToUpdate.length} services to update`);
    
    for (const service of servicesToUpdate) {
      try {
        console.log(`Updating service: ${service.service?.name} for user: ${service.user?.name}`);
        
        // Set trạng thái đang cập nhật
        service.autoUpdate.isUpdating = true;
        await service.save();
        console.log(`Set isUpdating = true for service ${service._id}`);
        
        
        // Gọi các link_update
        if (service.link_update && service.link_update.length > 0) {
          await Promise.all(
            service.link_update.map(async (link) => {
              if (link.url) {
                try {
                  const response = await fetch(link.url, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    mode: 'cors'
                  });
                  console.log(`Successfully called update link: ${link.url} - Status: ${response.status}`);
                } catch (error) {
                  console.error(`Error calling update link ${link.url}:`, error.message);
                }
              }
            })
          );
        }
        
        // Cập nhật thời gian cập nhật cuối cùng
        service.autoUpdate.lastUpdateAt = new Date();
        
        // Tính nextUpdateAt dựa trên loại cập nhật
        if (service.autoUpdate.scheduleType) {
          // Xử lý schedule
          const nextUpdateAt = calculateNextScheduleTime(
            service.autoUpdate.scheduleType,
            service.autoUpdate.scheduleTime,
            service.autoUpdate.scheduleDate,
            service.autoUpdate.scheduleDays
          );
          service.autoUpdate.nextUpdateAt = nextUpdateAt;
        } else {
          // Xử lý interval
          service.autoUpdate.nextUpdateAt = new Date(Date.now() + service.autoUpdate.interval * 60 * 1000);
        }
        
        service.autoUpdate.isUpdating = false;
        await service.save();
        console.log(`Updated last update time for service: ${service._id}`);
        
      } catch (error) {
        console.error(`Error updating service ${service._id}:`, error.message);
      }
    }
    
    console.log("Auto update process completed");
  } catch (error) {
    console.error("Error in auto update process:", error);
  }
};

// Hàm chính
const main = async () => {
  await connectDB();
  
  // Chạy cập nhật tự động
  await performAutoUpdate();
  
  // Đóng kết nối database
  await mongoose.connection.close();
  console.log("Database connection closed");
  process.exit(0);
};

// Xử lý lỗi
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Chạy script
main();
