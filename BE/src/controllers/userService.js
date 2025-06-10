import UserService from "../model/UserService.js";
import User from "../model/User.js";
import Service from "../model/Service.js";

// Lấy danh sách service đang chờ xác nhận
export const getPendingServices = async (req, res, next) => {
    try {
        const { search, status } = req.query;
        
        // Build query conditions
        const query = {};
        
        // Add status filter if provided
        if (status) {
            query.status = status;
        }

        // Handle combined user and service search
        if (search) {
            // Find matching users
            const matchingUsers = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = matchingUsers.map(user => user._id);

            // Find matching services
            const matchingServices = await Service.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { slug: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const serviceIds = matchingServices.map(service => service._id);

            // Apply conditions if any matches are found
            const orConditions = [];
            if (userIds.length > 0) {
                orConditions.push({ user: { $in: userIds } });
            }
            if (serviceIds.length > 0) {
                orConditions.push({ service: { $in: serviceIds } });
            }

            if (orConditions.length > 0) {
                query.$or = orConditions;
            } else {
                // If no user or service matches the search, return empty result
                return res.status(200).json({ 
                    data: { 
                        docs: [], 
                        totalDocs: 0, 
                        limit: 10, 
                        page: 1, 
                        totalPages: 0 
                    } 
                });
            }
        }

        const options = {
            page: req.query.page ? +req.query.page : 1,
            limit: req.query.limit ? +req.query.limit : 10,
            sort: { createdAt: -1 },
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

        const data = await UserService.paginate(query, options);
        
        // Filter out documents where user or service failed to populate, or where essential fields are missing
        const filteredDocs = data.docs.filter(doc => 
            doc.user !== null && 
            doc.service !== null && 
            doc.user.name && 
            doc.user.email &&
            doc.service.name
        );

        // Calculate total pages based on filtered documents
        const totalDocs = await UserService.countDocuments(query);
        const totalPages = Math.ceil(totalDocs / options.limit);

        return res.status(200).json({
            data: {
                docs: filteredDocs,
                totalDocs: totalDocs,
                limit: options.limit,
                page: options.page,
                totalPages: totalPages
            }
        });
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
            sort: { createdAt: -1 },
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

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Trạng thái không hợp lệ" });
        }

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
        const { serviceId, customSlug } = req.body;
        const userId = req.user._id;

        // Chuyển đổi serviceId thành mảng nếu là string
        const serviceIds = Array.isArray(serviceId) ? serviceId : [serviceId];
        
        const results = [];
        const errors = [];

        for (const sid of serviceIds) {
            // Kiểm tra xem đã có yêu cầu tương tự chưa
            const existingRequest = await UserService.findOne({
                user: userId,
                service: sid,
                status: 'waiting'
            });

            if (existingRequest) {
                errors.push({
                    serviceId: sid,
                    message: "Đã có yêu cầu thêm service này đang chờ xác nhận"
                });
                continue;
            }

            // Tạo instance mới và lưu để trigger pre-save hook
            const userService = new UserService({
                user: userId,
                service: sid,
                status: 'waiting',
                customSlug: customSlug // Nếu có customSlug được cung cấp
            });
            await userService.save();

            // Cập nhật service vào user
            await User.findByIdAndUpdate(
                userId,
                { $addToSet: { service: userService._id } }
            );

            // Populate thông tin đầy đủ
            const populatedUserService = await UserService.findById(userService._id)
                .populate('user', 'name email phone address avatar')
                .populate('service', 'name slug image status description')
                .populate('approvedBy', 'name email avatar');

            results.push(populatedUserService);
        }

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
                userServices: results,
                user: updatedUser,
                errors: errors.length > 0 ? errors : undefined
            },
            message: errors.length === 0 
                ? "Tất cả yêu cầu thêm service đã được gửi, đang chờ xác nhận"
                : "Một số yêu cầu thêm service đã được gửi, một số yêu cầu đã tồn tại"
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

// Cập nhật link cho user service
export const updateUserServiceLinks = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { links } = req.body;
        const userId = req.user._id;

        // Tìm UserService
        const userService = await UserService.findById(id);
        if (!userService) {
            return res.status(404).json({ message: "Không tìm thấy thông tin service" });
        }

        // Kiểm tra quyền cập nhật (chỉ user sở hữu hoặc admin mới được cập nhật)
        if (userService.user.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Bạn không có quyền cập nhật service này" });
        }

        // Validate và format links
        if (links && Array.isArray(links)) {
            const formattedLinks = links.map(link => {
                if (typeof link === 'string') {
                    return {
                        url: link,
                        title: 'Link không có tiêu đề',
                        description: ''
                    };
                }
                return {
                    url: link.url || '',
                    title: link.title || 'Link không có tiêu đề',
                    description: link.description || ''
                };
            });
            userService.link = formattedLinks;
        }

        await userService.save();

        // Populate thông tin đầy đủ trước khi trả về
        const updatedUserService = await UserService.findById(userService._id)
            .populate('user', 'name email phone address avatar')
            .populate('service', 'name slug image status description')
            .populate('approvedBy', 'name email avatar');

        return res.status(200).json({
            data: updatedUserService,
            message: "Cập nhật link thành công"
        });
    } catch (error) {
        next(error);
    }
};