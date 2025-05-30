import UserService from "../model/UserService.js";
import User from "../model/User.js";

// Lấy danh sách service đang chờ xác nhận
export const getPendingServices = async (req, res, next) => {
    try {
        const options = {
            page: req.query.page ? +req.query.page : 1,
            limit: req.query.limit ? +req.query.limit : 10,
            populate: [
                { 
                    path: 'user', 
                    select: 'name email phone address avatar' 
                },
                { 
                    path: 'service', 
                    select: 'name slug image status description' 
                },
                {
                    path: 'approvedBy',
                    select: 'name email avatar'
                }
            ]
        };

        const data = await UserService.paginate({ status: 'waiting' }, options);
        return res.status(200).json({ data });
    } catch (error) {
        next(error);
    }
};

// Lấy danh sách service của user
export const getUserServices = async (req, res, next) => {
    try {
        const options = {
            page: req.query.page ? +req.query.page : 1,
            limit: req.query.limit ? +req.query.limit : 10,
            populate: [
                { 
                    path: 'service', 
                    select: 'name slug image status description' 
                },
                {
                    path: 'approvedBy',
                    select: 'name email avatar'
                }
            ]
        };

        const data = await UserService.paginate({ user: req.params.userId }, options);
        return res.status(200).json({ data });
    } catch (error) {
        next(error);
    }
};

// Admin xác nhận service cho user
export const approveUserService = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        const userService = await UserService.findById(id);
        if (!userService) {
            return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
        }

        if (status === 'approved') {
            // Thêm UserService vào user nếu được xác nhận
            await User.findByIdAndUpdate(
                userService.user,
                { $addToSet: { services: userService._id } }
            );
        }

        // Cập nhật trạng thái xác nhận
        userService.status = status;
        userService.approvedBy = req.user._id;
        userService.approvedAt = new Date();
        if (status === 'rejected' && reason) {
            userService.reason = reason;
        }

        await userService.save();

        // Populate thông tin đầy đủ trước khi trả về
        const populatedUserService = await UserService.findById(userService._id)
            .populate('user', 'name email phone address avatar')
            .populate('service', 'name slug image status description')
            .populate('approvedBy', 'name email avatar');

        return res.status(200).json({
            data: populatedUserService,
            message: status === 'approved' ? "Xác nhận service thành công" : "Từ chối service thành công"
        });
    } catch (error) {
        next(error);
    }
};

// Thêm service vào user (sẽ ở trạng thái chờ xác nhận)
export const addServiceToUser = async (req, res, next) => {
    try {
        const { serviceId } = req.body;
        const userId = req.user._id; // Lấy userId từ token

        // Kiểm tra xem đã có yêu cầu tương tự chưa
        const existingRequest = await UserService.findOne({
            user: userId,
            service: serviceId,
            status: 'waiting'
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Đã có yêu cầu thêm service này đang chờ xác nhận" });
        }

        // Tạo instance mới và lưu để trigger pre-save hook
        const userService = new UserService({
            user: userId,
            service: serviceId,
            status: 'waiting'
        });
        await userService.save();

        // Cập nhật service vào user
        await User.findByIdAndUpdate(
            userId,
            { $addToSet: { service: userService._id } }
        );

        // Populate thông tin đầy đủ trước khi trả về
        const populatedUserService = await UserService.findById(userService._id)
            .populate('user', 'name email phone address avatar')
            .populate('service', 'name slug image status description')
            .populate('approvedBy', 'name email avatar');

        // Lấy thông tin user đã cập nhật
        const updatedUser = await User.findById(userId)
            .populate({
                path: 'service',
                populate: {
                    path: 'service',
                    select: 'name slug image status description'
                }
            });

        return res.status(201).json({
            data: {
                userService: populatedUserService,
                user: updatedUser
            },
            message: "Yêu cầu thêm service đã được gửi, đang chờ xác nhận"
        });
    } catch (error) {
        next(error);
    }
};

// Lấy chi tiết của một user service
export const getUserServiceDetail = async (req, res, next) => {
    try {
        const { id } = req.params;

        const userService = await UserService.findById(id)
            .populate('user', 'name email phone address avatar')
            .populate('service', 'name slug image status description')
            .populate('approvedBy', 'name email avatar');

        if (!userService) {
            return res.status(404).json({ message: "Không tìm thấy thông tin service" });
        }

        return res.status(200).json({
            data: userService,
            message: "Lấy thông tin service thành công"
        });
    } catch (error) {
        next(error);
    }
};

// Xóa service khỏi user
export const removeUserService = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Tìm UserService
        const userService = await UserService.findById(id);
        if (!userService) {
            return res.status(404).json({ message: "Không tìm thấy thông tin service" });
        }

        // Kiểm tra quyền xóa (chỉ user sở hữu hoặc admin mới được xóa)
        if (userService.user.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Bạn không có quyền xóa service này" });
        }

        // Xóa UserService
        await UserService.findByIdAndDelete(id);

        // Cập nhật lại danh sách service của user
        await User.findByIdAndUpdate(
            userId,
            { $pull: { service: id } }
        );

        // Lấy thông tin user đã cập nhật
        const updatedUser = await User.findById(userId)
            .populate({
                path: 'service',
                populate: [
                    { path: 'service', select: 'name slug image status description' },
                    { path: 'approvedBy', select: 'name email avatar' }
                ]
            });

        return res.status(200).json({
            data: updatedUser,
            message: "Xóa service thành công"
        });
    } catch (error) {
        next(error);
    }
};
