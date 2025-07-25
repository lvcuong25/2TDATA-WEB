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
        
        // Apply site filter based on user role
        // Super admin can see all user services across all sites
        if (req.user && req.user.role === 'super_admin') {
            // No site filter needed
        }
        // Site admin can only see user services from their site
        else if (req.user && req.user.role === 'site_admin') {
            const siteId = req.user.site_id || req.site?._id;
            if (siteId) {
                query.site_id = siteId;
            }
        }
        // For other users, apply site filter from middleware
        else if (req.siteId) {
            query.site_id = req.siteId;
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

        const userService = await UserService.findById(id).populate('site_id');
        if (!userService) {
            return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
        }
        
        // Kiểm tra quyền: site_admin chỉ được xử lý request của site mình
        if (req.user.role === 'site_admin' && req.user.site_id) {
            if (userService.site_id && userService.site_id.toString() !== req.user.site_id.toString()) {
                return res.status(403).json({ message: "Bạn không có quyền xử lý yêu cầu của site khác" });
            }
        }

        if (status === 'approved') {
            // Thêm UserService vào user nếu được xác nhận
            await User.findByIdAndUpdate(
                userService.user,
                { $addToSet: { services: userService._id } }
            );
        } else if (status === 'rejected') {
            // Xóa UserService khỏi user khi bị từ chối
            await User.findByIdAndUpdate(
                userService.user,
                { $pull: { service: userService._id } }
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

            // Get site_id from request context
            const siteId = req.siteId || req.user.site_id;
            if (!siteId) {
                return res.status(400).json({
                    message: "Site ID is required for service registration"
                });
            }

            // Tạo instance mới và lưu để trigger pre-save hook
            const userService = new UserService({
                user: userId,
                service: sid,
                site_id: siteId, // Add site_id where service was registered
                status: 'waiting',
                customSlug: customSlug, // Nếu có customSlug được cung cấp
                link: [] // Thêm mảng link rỗng
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

// Cập nhật link cho user service
export const updateUserServiceLinks = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { links, link_update } = req.body;
        const userId = req.user._id;

        // Tìm UserService
        const userService = await UserService.findById(id);
        if (!userService) {
            return res.status(404).json({ message: "Không tìm thấy thông tin service" });
        }

        // Kiểm tra quyền cập nhật (chỉ user sở hữu hoặc admin mới được cập nhật)
        const isOwner = userService.user.toString() === userId.toString();
        const isAdmin = req.user.role === 'super_admin' || req.user.role === 'site_admin';
        
        if (!isOwner && !isAdmin) {
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

        // Validate và format link_update
        if (link_update && Array.isArray(link_update)) {
            const formattedUpdateLinks = link_update.map(link => {
                if (typeof link === 'string') {
                    return {
                        url: link,
                        title: 'Link cập nhật không có tiêu đề',
                        description: ''
                    };
                }
                return {
                    url: link.url || '',
                    title: link.title || 'Link cập nhật không có tiêu đề',
                    description: link.description || ''
                };
            });
            userService.link_update = formattedUpdateLinks;
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
};// Xóa service khỏi user (chỉ khi status = rejected)
export const removeUserService = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Tìm UserService
        const userService = await UserService.findById(id)
            .populate('user')
            .populate('service')
            .populate('site_id');
            
        if (!userService) {
            return res.status(404).json({ message: "Không tìm thấy thông tin service" });
        }

        // Kiểm tra quyền xóa
        let canDelete = false;
        
        // Super-admin có thể xóa tất cả
        if (req.user.role === 'super_admin') {
            canDelete = true;
        }
        // Site admin có thể xóa service trong site của mình
        else if (req.user.role === 'site_admin' && req.user.site_id) {
            // Check if userService has site_id and handle both populated and non-populated cases
            if (userService.site_id) {
                const serviceSiteId = userService.site_id._id ? userService.site_id._id.toString() : userService.site_id.toString();
                const adminSiteId = req.user.site_id._id ? req.user.site_id._id.toString() : req.user.site_id.toString();
                canDelete = serviceSiteId === adminSiteId; // Site admin can delete any status
                
                // Log for debugging
                console.log('Site admin permission check:', {
                    userServiceSiteId: serviceSiteId,
                    adminSiteId: req.user.site_id.toString(),
                    canDelete: canDelete
                });
            } else {
                // If userService doesn't have site_id, deny access for site_admin
                canDelete = false;
                console.log('UserService missing site_id, denying site_admin access');
            }
        }
        // User thường chỉ có thể xóa service bị rejected của chính mình
        else if (userService.user._id.toString() === userId.toString()) {
            canDelete = userService.status === 'rejected';
        }

        if (!canDelete) {
            return res.status(403).json({ 
                message: "Bạn không có quyền xóa service này" 
            });
        }

        // Xóa reference từ User model
        await User.findByIdAndUpdate(
            userService.user._id,
            { $pull: { service: userService._id } }
        );

        // Xóa UserService document
        await UserService.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Xóa service thành công"
        });
    } catch (error) {
        next(error);
    }
};

// Xóa user service (cho admin)
export const deleteUserService = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Kiểm tra quyền - chỉ admin mới được xóa
        if (req.user.role !== 'super_admin' && req.user.role !== 'site_admin') {
            return res.status(403).json({ 
                message: "Bạn không có quyền xóa dịch vụ này" 
            });
        }

        // Tìm UserService
        const userService = await UserService.findById(id)
            .populate('user', '_id')
            .populate('service', '_id');

        if (!userService) {
            return res.status(404).json({ 
                message: "Không tìm thấy dịch vụ này" 
            });
        }
        // Kiểm tra quyền site_admin với site_id
        if (req.user.role === 'site_admin' && req.user.site_id) {
            // Lấy user info để kiểm tra site_id
            const userInfo = await User.findById(userService.user).select('site_id');
            
            if (userInfo && userInfo.site_id) {
                const userSiteId = userInfo.site_id.toString();
                const adminSiteId = req.user.site_id.toString();
                
                if (userSiteId !== adminSiteId) {
                    return res.status(403).json({ 
                        message: "Bạn chỉ có thể xóa dịch vụ của users trong site của mình" 
                    });
                }
            }
        }

        // Xóa reference từ User model
        if (userService.user) {
            await User.findByIdAndUpdate(
                userService.user._id,
                { $pull: { service: userService._id } }
            );
        }

        // Xóa UserService document
        await UserService.findByIdAndDelete(id);

        logger.info('Admin deleted UserService', {
            userServiceId: id,
            userId: userService.user?._id,
            serviceId: userService.service?._id,
            adminId: req.user._id
        });

        return res.status(200).json({
            message: "Xóa dịch vụ thành công"
        });
    } catch (error) {
        next(error);
    }
};
