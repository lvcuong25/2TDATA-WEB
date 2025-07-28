import Server from '../model/Server.js';
import User from '../model/User.js';

// Tạo server mới
export const createServer = async (req, res, next) => {
  try {
    let { users, link, apiCode, description, status, userLimits } = req.body;
    
    // Đảm bảo users luôn là mảng
    if (users && !Array.isArray(users)) {
      users = [users];
    }

    // Validate user limits if provided
    if (userLimits) {
      if (userLimits.min && userLimits.max && userLimits.min > userLimits.max) {
        return res.status(400).json({ 
          message: 'Số lượng người dùng tối thiểu không thể lớn hơn số lượng tối đa' 
        });
      }
      
      // Check if initial users exceed max limit
      if (userLimits.max && users && users.length > userLimits.max) {
        return res.status(400).json({ 
          message: `Số lượng người dùng ban đầu (${users.length}) vượt quá giới hạn tối đa (${userLimits.max})` 
        });
      }
    }

    const server = await Server.create({ 
      users, 
      link, 
      apiCode, 
      description, 
      status, 
      userLimits 
    });
    
    res.status(201).json({ data: server, message: 'Tạo server thành công' });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách server (có thể filter theo user, status)
export const getServers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.user) filter.users = req.query.user;
    if (req.query.status) filter.status = req.query.status;
    
    const servers = await Server.find(filter)
      .populate('users', 'name email')
      .lean();
    
    // Add computed fields for each server
    const serversWithStats = servers.map(server => ({
      ...server,
      currentUserCount: server.users ? server.users.length : 0,
      canAcceptUser: server.userLimits?.max ? (server.users?.length || 0) < server.userLimits.max : true,
      availableSlots: server.userLimits?.max ? Math.max(0, server.userLimits.max - (server.users?.length || 0)) : null
    }));
    
    res.status(200).json({ data: serversWithStats });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết server theo id
export const getServerById = async (req, res, next) => {
  try {
    const server = await Server.findById(req.params.id)
      .populate({
        path: 'users',
        select: 'name email site_id',
        populate: { path: 'site_id', select: 'name domain' }
      });
    
    if (!server) return res.status(404).json({ message: 'Không tìm thấy server' });
    
    // Add computed fields
    const serverWithStats = {
      ...server.toObject(),
      currentUserCount: server.users ? server.users.length : 0,
      canAcceptUser: server.canAcceptUser(),
      meetsMinimumUsers: server.meetsMinimumUsers(),
      availableSlots: server.getAvailableSlots()
    };
    
    res.status(200).json({ data: serverWithStats });
  } catch (error) {
    next(error);
  }
};

// Sửa server
export const updateServer = async (req, res, next) => {
  try {
    let { users, link, apiCode, description, status, userLimits } = req.body;
    
    // Đảm bảo users luôn là mảng
    if (users && !Array.isArray(users)) {
      users = [users];
    }

    // Get current server to check existing users
    const currentServer = await Server.findById(req.params.id);
    if (!currentServer) {
      return res.status(404).json({ message: 'Không tìm thấy server' });
    }

    // Validate user limits if provided
    if (userLimits) {
      if (userLimits.min && userLimits.max && userLimits.min > userLimits.max) {
        return res.status(400).json({ 
          message: 'Số lượng người dùng tối thiểu không thể lớn hơn số lượng tối đa' 
        });
      }
      
      // Check if current users exceed new max limit
      const currentUserCount = currentServer.users ? currentServer.users.length : 0;
      if (userLimits.max && currentUserCount > userLimits.max) {
        return res.status(400).json({ 
          message: `Số lượng người dùng hiện tại (${currentUserCount}) vượt quá giới hạn tối đa mới (${userLimits.max})` 
        });
      }
    }

    const server = await Server.findByIdAndUpdate(
      req.params.id,
      { users, link, apiCode, description, status, userLimits },
      { new: true }
    ).populate('users', 'name email');
    
    if (!server) return res.status(404).json({ message: 'Không tìm thấy server' });
    
    res.status(200).json({ data: server, message: 'Cập nhật server thành công' });
  } catch (error) {
    next(error);
  }
};

// Xóa server
export const deleteServer = async (req, res, next) => {
  try {
    const server = await Server.findByIdAndDelete(req.params.id);
    if (!server) return res.status(404).json({ message: 'Không tìm thấy server' });
    res.status(200).json({ message: 'Xóa server thành công' });
  } catch (error) {
    next(error);
  }
};

// Thêm user vào server
export const addUserToServer = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const serverId = req.params.id;

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Không tìm thấy server' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Check if user is already in server
    if (server.users && server.users.includes(userId)) {
      return res.status(400).json({ message: 'Người dùng đã có trong server' });
    }

    // Check user limits
    if (!server.canAcceptUser()) {
      return res.status(400).json({ 
        message: `Server đã đạt giới hạn tối đa (${server.userLimits.max} người dùng)` 
      });
    }

    // Add user to server
    server.users = server.users || [];
    server.users.push(userId);
    await server.save();

    const updatedServer = await Server.findById(serverId)
      .populate('users', 'name email');

    res.status(200).json({ 
      data: updatedServer, 
      message: 'Thêm người dùng vào server thành công' 
    });
  } catch (error) {
    next(error);
  }
};

// Xóa user khỏi server
export const removeUserFromServer = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const serverId = req.params.serverId;

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Không tìm thấy server' });
    }

    // Check if user is in server
    if (!server.users || !server.users.includes(userId)) {
      return res.status(400).json({ message: 'Người dùng không có trong server' });
    }

    // Check minimum user requirement
    if (server.userLimits?.min && server.users.length <= server.userLimits.min) {
      return res.status(400).json({ 
        message: `Không thể xóa người dùng. Server cần tối thiểu ${server.userLimits.min} người dùng` 
      });
    }

    // Remove user from server
    server.users = server.users.filter(id => id.toString() !== userId);
    await server.save();

    const updatedServer = await Server.findById(serverId)
      .populate('users', 'name email');

    res.status(200).json({ 
      data: updatedServer, 
      message: 'Xóa người dùng khỏi server thành công' 
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thống kê server
export const getServerStats = async (req, res, next) => {
  try {
    const serverId = req.params.id;
    const server = await Server.findById(serverId).populate('users', 'name email');
    
    if (!server) {
      return res.status(404).json({ message: 'Không tìm thấy server' });
    }

    const stats = {
      currentUserCount: server.currentUserCount,
      canAcceptUser: server.canAcceptUser(),
      meetsMinimumUsers: server.meetsMinimumUsers(),
      availableSlots: server.getAvailableSlots(),
      userLimits: server.userLimits,
      utilization: server.userLimits?.max ? 
        Math.round((server.currentUserCount / server.userLimits.max) * 100) : null
    };

    res.status(200).json({ data: stats });
  } catch (error) {
    next(error);
  }
}; 