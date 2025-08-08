import express from 'express';
import UserService from '../model/UserService.js';
import User from '../model/User.js';
import Server from '../model/Server.js';

// Controller cho webhook realtime
export const webhookRealtime = async (req, res, next) => {
  try {
    const webhookArray = req.body;
    if (!Array.isArray(webhookArray)) {
      return res.status(400).json({ message: 'Payload phải là mảng webhook' });
    }
    const results = [];
    for (const item of webhookArray) {
      const payload = item.data;
      if (!payload) continue;
      if (payload.type !== 'update-service') continue; // Chỉ update nếu đúng type
      const userServiceId = payload.service_id; // _id của UserService
      const newLinks = payload.data?.link || [];
      const newLinkUpdates = payload.data?.link_update || [];
      // Tìm UserService theo _id và cập nhật
      const updated = await UserService.findByIdAndUpdate(
        userServiceId,
        { link: newLinks, link_update: newLinkUpdates },
        { new: true }
      );
      if (updated) {
        results.push({ success: true, id: userServiceId });
      } else {
        results.push({ success: false, id: userServiceId, message: 'Không tìm thấy UserService' });
      }
    }
    return res.json({ message: 'Webhook realtime processed', results });
  } catch (error) {
    next(error);
  }
};

// Controller kiểm tra và gán user vào server
export const checkAndAssignUserToServer = async (req, res, next) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'Thiếu userId',
        hasServer: false 
      });
    }
    
    // Kiểm tra user có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user',
        hasServer: false
      });
    }
    
    // Kiểm tra xem user đã có server chưa
    const existingServer = await Server.findOne({
      users: { $in: [userId] }
    });
    
    if (existingServer) {
      // User đã có server, trả về thông tin server hiện tại
      return res.json({
        success: true,
        hasServer: true,
        userId: userId,
        userInfo: {
          _id: user._id,
          email: user.email,
          name: user.name
        },
        serverInfo: {
          serverId: existingServer._id,
          link: existingServer.link,
          apiCode: existingServer.apiCode,
          description: existingServer.description,
          userLimits: existingServer.userLimits,
          currentUserCount: existingServer.users.length
        },
        message: 'User đã có server',
        action: 'existing'
      });
    }
    
    // User chưa có server, tìm server có slot trống
    const availableServer = await Server.findOne({
      $expr: {
        $lt: [{ $size: "$users" }, "$userLimits.max"]
      },
      status: 'active'
    }).sort({ 'users.length': 1 }); // Ưu tiên server có ít user nhất
    
    if (availableServer) {
      // Gán user vào server có slot trống
      const updatedServer = await Server.findByIdAndUpdate(
        availableServer._id,
        { $push: { users: userId } },
        { new: true }
      );
      
      return res.json({
        success: true,
        hasServer: true,
        userId: userId,
        userInfo: {
          _id: user._id,
          email: user.email,
          name: user.name
        },
        serverInfo: {
          serverId: updatedServer._id,
          link: updatedServer.link,
          apiCode: updatedServer.apiCode,
          description: updatedServer.description,
          userLimits: updatedServer.userLimits,
          currentUserCount: updatedServer.users.length
        },
        message: 'User đã được gán vào server có sẵn',
        action: 'assigned_to_existing'
      });
    }
    
    // Không có server nào có slot trống, trả về thông tin tất cả server
    const allServers = await Server.find({ status: 'active' }).sort({ 'users.length': 1 });
    
    if (allServers.length === 0) {
      // Không có server nào trong database
      return res.status(404).json({
        success: false,
        hasServer: false,
        userId: userId,
        message: 'Không có server nào trong hệ thống. Vui lòng tạo server mới.',
        recommendation: 'Tạo server mới để gán user'
      });
    }
    
    // Tất cả server đều đầy
    const serverStatus = allServers.map(server => ({
      serverId: server._id,
      link: server.link,
      apiCode: server.apiCode,
      description: server.description,
      userLimits: server.userLimits,
      currentUserCount: server.users.length,
      availableSlots: Math.max(0, server.userLimits.max - server.users.length)
    }));
    
    return res.status(400).json({
      success: false,
      hasServer: false,
      userId: userId,
      message: 'Tất cả server đều đã đạt giới hạn tối đa. Không thể gán thêm user.',
      userInfo: {
        _id: user._id,
        email: user.email,
        name: user.name
      },
      availableServers: serverStatus,
      recommendation: 'Vui lòng tạo server mới hoặc đợi có slot trống'
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      hasServer: false,
      message: 'Lỗi server: ' + error.message
    });
  }
}; 