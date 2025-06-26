import UserInfo from '../model/UserInfo.js';

export const addUserInfo = async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;

    // Basic validation
    if (!name || !email || !phoneNumber) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Check if email and phone number combination already exists
    const existingUser = await UserInfo.findOne({ email, phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: 'Email và số điện thoại này đã được đăng ký' });
    }

    const newUserInfo = new UserInfo({
      name,
      email,
      phoneNumber
    });

    await newUserInfo.save();

    res.status(201).json({ 
      message: 'Đăng ký thông tin thành công', 
      userInfo: newUserInfo 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Get all user info with pagination
export const getAllUserInfo = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await UserInfo.countDocuments();
    const userInfos = await UserInfo.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      message: 'Lấy danh sách thành công',
      data: {
        userInfos,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Delete user info by ID
export const deleteUserInfo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedUserInfo = await UserInfo.findByIdAndDelete(id);
    
    if (!deletedUserInfo) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
    }

    res.status(200).json({ 
      message: 'Xóa thông tin thành công',
      userInfo: deletedUserInfo
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}; 