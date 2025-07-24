import Server from '../model/Server.js';
import User from '../model/User.js';

// Tạo server mới
export const createServer = async (req, res, next) => {
  try {
    let { users, link, apiCode, description, status } = req.body;
    // Đảm bảo users luôn là mảng
    if (users && !Array.isArray(users)) {
      users = [users];
    }
    const server = await Server.create({ users, link, apiCode, description, status });
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
    const servers = await Server.find(filter).populate('users', 'name email');
    res.status(200).json({ data: servers });
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
    res.status(200).json({ data: server });
  } catch (error) {
    next(error);
  }
};

// Sửa server
export const updateServer = async (req, res, next) => {
  try {
    let { users, link, apiCode, description, status } = req.body;
    // Đảm bảo users luôn là mảng
    if (users && !Array.isArray(users)) {
      users = [users];
    }
    const server = await Server.findByIdAndUpdate(
      req.params.id,
      { users, link, apiCode, description, status },
      { new: true }
    );
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