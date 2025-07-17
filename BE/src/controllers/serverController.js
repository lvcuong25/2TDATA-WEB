import Server from '../model/Server.js';
import User from '../model/User.js';

// Tạo server mới
export const createServer = async (req, res, next) => {
  try {
    const { userId, link, apiCode, description, status } = req.body;
    const server = await Server.create({ userId, link, apiCode, description, status });
    res.status(201).json({ data: server, message: 'Tạo server thành công' });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách server (có thể filter theo userId, status)
export const getServers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.status) filter.status = req.query.status;
    const servers = await Server.find(filter).populate('userId', 'name email');
    res.status(200).json({ data: servers });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết server theo id
export const getServerById = async (req, res, next) => {
  try {
    const server = await Server.findById(req.params.id).populate('userId', 'name email');
    if (!server) return res.status(404).json({ message: 'Không tìm thấy server' });
    res.status(200).json({ data: server });
  } catch (error) {
    next(error);
  }
};

// Sửa server
export const updateServer = async (req, res, next) => {
  try {
    const { link, apiCode, description, status } = req.body;
    const server = await Server.findByIdAndUpdate(
      req.params.id,
      { link, apiCode, description, status },
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