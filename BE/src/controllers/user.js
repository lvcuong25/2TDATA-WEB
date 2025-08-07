import mongoose from "mongoose";
import User from "../model/User.js";
import { hashPassword } from "../utils/password.js";
import logger from '../utils/logger.js';
import { canAssignRole, getAssignableRoles, ROLES } from '../utils/roleHierarchy.js';
import Site from '../model/Site.js';
import UserService from '../model/UserService.js';
export const getAllUser = async (req, res, next) => {
    try {
        const options = {
            page: req.query.page ? +req.query.page : 1,
            limit: req.query.limit ? +req.query.limit : 10,
            sort: req.query.sort ? req.query.sort : { createdAt: -1 },
            populate: [
                {
                    path: 'service',
                    populate: [
                        { path: 'service', select: 'name slug image status description authorizedLinks' },
                        { path: 'approvedBy', select: 'name email avatar' }
                    ]
                },
                {
                    path: 'site_id',
                    select: 'name domains'
                }
            ]
        };
        let query = {};
        if (req.query.name) {
            query.$or = [
                { name: { $regex: new RegExp(req.query.name, 'i') } },
                { email: { $regex: new RegExp(req.query.name, 'i') } },
                { phone: { $regex: new RegExp(req.query.name, 'i') } }
            ];
        }
        if (req.query.role) {
            query.role = req.query.role;
        }
        if (req.query.active) {
            query.active = req.query.active;
        }
        
        // Apply site filter based on user role
        let finalFilter = { ...query };
        
        // Super admin can see all users across all sites
        if (req.user && req.user.role === 'super_admin') {
            // No filter needed, can see all users
            logger.info('Super admin accessing all users', {
                adminId: req.user._id,
                adminEmail: req.user.email
            });
            // Don't add any site filter for super admin
        } 
        // Site admin can only see users from their site
        else if (req.user && req.user.role === 'site_admin') {
            // Use user's site_id if available, otherwise use detected site
            const siteId = req.user.site_id || req.site?._id;
            if (siteId) {
                finalFilter.site_id = siteId;
                logger.info('Site admin accessing site users', {
                    adminId: req.user._id,
                    adminEmail: req.user.email,
                    siteId: siteId,
                    siteName: req.site?.name
                });
            }
        }
        // Regular admin or member - apply site filter from middleware
        else if (req.siteFilter && Object.keys(req.siteFilter).length > 0) {
            finalFilter = { ...finalFilter, ...req.siteFilter };
        }
        // Default case - filter by current site if available
        else if (req.site) {
            finalFilter.site_id = req.site._id;
        }
        
        const result = await User.paginate(finalFilter, options);
        return !result ? res.status(400).json({ message: "Get all user failed" }) : res.status(200).json({ data: result })
    } catch (error) {
        next(error);
    }
}

export const getUserById = async (req, res, next) => {
    try {
        const data = await User.findById(req.params.id)
            .populate({
                path: 'service',
                populate: [
                    { path: 'service', select: 'name slug image status description authorizedLinks' },
                    { path: 'approvedBy', select: 'name email avatar' }
                ]
            })
            .populate('site_id', 'name domains');
        return !data ? res.status(500).json({ message: "Get user by id failed" }) : res.status(200).json({ data });
    }
    catch (error) {
        next(error);
    }
}

export const createUser = async (req, res, next) => {
    try {
        const { email, name, password, role, site_id } = req.body;
        const creatorRole = req.user?.role || 'member';
        
        // Log request to debug duplicate calls
        logger.info('Create user request received', {
            email,
            name,
            role,
            creatorId: req.user?._id,
            creatorRole,
            requestId: req.headers['x-request-id'] || 'no-request-id',
            timestamp: new Date().toISOString()
        });
        
        // Validate role assignment
        if (role) {
            if (!canAssignRole(creatorRole, role)) {
                return res.status(403).json({ 
                    message: `You cannot assign ${role} role. You can only assign roles lower than your own.`,
                    assignableRoles: getAssignableRoles(creatorRole)
                });
            }
        }
        
        // Validate site_id requirement
        let finalSiteId = site_id;
        console.log("DEBUG createUser:", { site_id, userSiteId: req.user.site_id, userSiteIdStr: req.user.site_id?.toString(), reqSiteId: req.siteId });
        
        // For non-super_admin roles, site_id is required
        if (role !== ROLES.SUPER_ADMIN) {
            if (!finalSiteId) {
                // If creator is site_admin, use their site_id
                if (creatorRole === ROLES.SITE_ADMIN && req.user.site_id) {
                    finalSiteId = req.user.site_id;
                }
                // If site detection middleware provided site_id
                else if (req.siteId) {
                    finalSiteId = req.siteId;
                }
                else {
                    return res.status(400).json({ 
                        message: "Site ID is required for non-super_admin users" 
                    });
                }
            }
            
            // Validate that site_admin can only create users for their own site
            if (creatorRole === ROLES.SITE_ADMIN) {
                const userSiteId = req.user.site_id._id || req.user.site_id;
                if (finalSiteId.toString() !== userSiteId.toString()) {
                    return res.status(403).json({ 
                        message: "Site admins can only create users for their own site" 
                    });
                }
            }
        }
        
        // Hash password
        const hashedPassword = await hashPassword(password);
        
// Check if email already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ 
                message: "Email is already registered. Please use a different email." 
            });
        }

        // Create user
        const userData = {
            email,
            name,
            password: hashedPassword,
            role: role || 'member',
            site_id: finalSiteId
        };

        const data = await User.create(userData);

        // Populate site info
        await data.populate('site_id', 'name domains');

        // User created successfully

        return res.status(201).json({
            data,
            message: "User created successfully"
        });
    } catch (error) {
        logger.error('User creation failed', {
            error: error.message,
            adminId: req.user?._id,
            userData: { email: req.body.email, role: req.body.role },
            ip: req.ip
        });
        next(error);
    }
}

export const removeUserById = async (req, res, next) => {
    try {
        // Get user data before deactivation for audit logging
        const userData = await User.findById(req.params.id);
        if (!userData) {
            return res.status(404).json({ message: "User not found" });
        }

        const data = await User.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
        
        // User deactivated successfully
        
        return !data ? 
            res.status(500).json({ message: "Vô hiệu hóa người dùng thất bại" }) : 
            res.status(200).json({ data, message: "Vô hiệu hóa người dùng thành công!" });
    } catch (error) {
        logger.error('User deactivation failed', {
            error: error.message,
            adminId: req.user?._id,
            targetUserId: req.params.id,
            ip: req.ip
        });
        next(error);
    }
};

export const deleteUserById = async (req, res, next) => {
    try {
        // Check if user is super admin
        if (req.user.role !== ROLES.SUPER_ADMIN) {
            return res.status(403).json({ 
                message: "Chỉ Super Admin mới có quyền xóa người dùng vĩnh viễn" 
            });
        }

        // Get user data before deletion for audit logging
        const userData = await User.findById(req.params.id);
        if (!userData) {
            return res.status(404).json({ message: "User not found" });
        }

        // Prevent super admin from deleting themselves
        if (userData._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ 
                message: "Không thể xóa chính tài khoản của mình" 
            });
        }

        // Prevent super admin from deleting other super admins
        if (userData.role === ROLES.SUPER_ADMIN) {
            return res.status(403).json({ 
                message: "Không thể xóa Super Admin khác" 
            });
        }

        // Delete all UserService documents associated with this user
        await UserService.deleteMany({ user: req.params.id });

        // Delete the user permanently
        const data = await User.findByIdAndDelete(req.params.id);
        
        if (!data) {
            return res.status(500).json({ message: "Xóa người dùng thất bại" });
        }

        // Log the deletion for audit purposes
        logger.info('User permanently deleted', {
            deletedUserId: req.params.id,
            deletedUserEmail: userData.email,
            deletedUserName: userData.name,
            deletedUserRole: userData.role,
            adminId: req.user._id,
            adminEmail: req.user.email,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });
        
        return res.status(200).json({ 
            message: "Xóa người dùng thành công",
            deletedUser: {
                id: userData._id,
                email: userData.email,
                name: userData.name,
                role: userData.role
            }
        });
    } catch (error) {
        logger.error('User deletion failed', {
            error: error.message,
            adminId: req.user?._id,
            targetUserId: req.params.id,
            ip: req.ip
        });
        next(error);
    }
};

export const restoreUserById = async (req, res, next) => {
    try {
        // Get user data before restoration for audit logging
        const userData = await User.findById(req.params.id);
        if (!userData) {
            return res.status(404).json({ message: "User not found" });
        }

        const data = await User.findByIdAndUpdate(req.params.id, { active: true }, { new: true });
        
        // User restored successfully
        
        return !data ? 
            res.status(500).json({ message: "Khôi phục người dùng thất bại" }) : 
            res.status(200).json({ data, message: "Khôi phục người dùng thành công" });
    } catch (error) {
        logger.error('User restoration failed', {
            error: error.message,
            adminId: req.user?._id,
            targetUserId: req.params.id,
            ip: req.ip
        });
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        // Log request to debug duplicate calls
        logger.info('Update user request received', {
            userId: req.params.id,
            updateData: { ...req.body, password: req.body.password ? '[REDACTED]' : undefined },
            adminId: req.user?._id,
            requestId: req.headers['x-request-id'] || 'no-request-id',
            timestamp: new Date().toISOString()
        });
        
        // Get original user data for audit logging
        const originalUser = await User.findById(req.params.id);
        if (!originalUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if email is being updated and if it already exists
        if (req.body.email && req.body.email !== originalUser.email) {
            const existingUser = await User.findOne({ email: req.body.email });
            if (existingUser) {
                return res.status(400).json({ 
                    message: "Email is already registered. Please use a different email." 
                });
            }
        }

        // Hash password if it is being updated
        if (req.body.password) {
            req.body.password = await hashPassword(req.body.password);
        }

        // If updating services, validate and convert to ObjectIds
        if (req.body.service) {
            // Ensure service is an array of objects with id and status
            const newServices = Array.isArray(req.body.service) ? req.body.service : [req.body.service];
            
            // Get existing UserServices for this user
            const UserService = mongoose.model('UserService');
            const existingUserServices = await UserService.find({ user: req.params.id });
            const existingServiceIds = existingUserServices.map(us => us.service.toString());
            const newServiceIds = newServices.map(s => s.id);
            
            // Find services to delete (exist in DB but not in new list)
            const servicesToDelete = existingServiceIds.filter(id => !newServiceIds.includes(id));
            
            // Delete removed UserServices
            if (servicesToDelete.length > 0) {
                await UserService.deleteMany({
                    user: req.params.id,
                    service: { $in: servicesToDelete }
                });
                
                logger.info('Deleted UserServices', {
                    userId: req.params.id,
                    deletedServices: servicesToDelete,
                    adminId: req.user?._id
                });
            }
            
            // Create or update UserService documents for each service
            const servicePromises = newServices.map(async (service) => {
                // Check if service already exists for this user
                const existingService = await UserService.findOne({
                    user: req.params.id,
                    service: service.id
                });

                if (existingService) {
                    // Update existing service status if provided
                    if (service.status) {
                        existingService.status = service.status;
                        await existingService.save();
                    }
                    return existingService._id;
                } else {
                    // Get site_id from the original user or from current site context
                    const siteId = originalUser.site_id || req.site?._id;
                    
                    // Create new service with default 'waiting' status
                    const newUserService = await UserService.create({
                        user: req.params.id,
                        service: service.id,
                        site_id: siteId,
                        status: service.status || 'waiting'
                    });
                    return newUserService._id;
                }
            });

            // Wait for all service operations to complete
            const serviceIds = await Promise.all(servicePromises);
            req.body.service = serviceIds;
        }

        const data = await User.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        ).populate({
            path: 'service',
            populate: [
                { path: 'service', select: 'name slug image status description authorizedLinks' },
                { path: 'approvedBy', select: 'name email avatar' }
            ]
        });

        // User updated successfully

        return !data ? 
            res.status(500).json({ message: "Cập nhật thông tin thất bại!" }) : 
            res.status(200).json({ data, message: "Cập nhật thông tin thành công" });
    } catch (error) {
        logger.error('User update failed', {
            error: error.message,
            adminId: req.user?._id,
            targetUserId: req.params.id,
            updateData: { ...req.body, password: req.body.password ? '[REDACTED]' : undefined },
            ip: req.ip
        });
        next(error);
    }
}

export const getUserByEmail = async (req, res, next) => {
    try {
        const data = await User.find({ email: req.params.email });
        return !data ? res.status(500).json({ message: "Get user by email failed" }) : res.status(200).json({ data });
    } catch (error) {
        next(error);
    }
}

export const updateUserProfile = async (req, res, next) => {
    try {
        // If updating services, validate and convert to ObjectIds
        if (req.body.service) {
            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Ensure service is an array
            const newServices = Array.isArray(req.body.service) ? req.body.service : [req.body.service];
            
            // Validate each service ID
            const validServices = newServices.filter(serviceId => 
                mongoose.Types.ObjectId.isValid(serviceId)
            );

            if (validServices.length !== newServices.length) {
                return res.status(400).json({ 
                    message: "One or more service IDs are invalid" 
                });
            }

            // Update the services array
            req.body.service = validServices;
        }

        const data = await User.findByIdAndUpdate(
            req.user._id, 
            req.body, 
            { new: true }
        ).populate({
            path: 'service',
            populate: [
                { path: 'service', select: 'name slug image status description authorizedLinks' },
                { path: 'approvedBy', select: 'name email avatar' }
            ]
        });
        
        return !data ? 
            res.status(500).json({ message: "Update profile failed" }) : 
            res.status(200).json({ data, message: "Cập nhật profile thành công" });
    }
    catch (error) {
        next(error);
    }
}

// Xóa dịch vụ khỏi user theo userId truyền params
export const removeServiceFromUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { serviceId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({ message: "Invalid userId or serviceId" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Xóa reference từ user
        user.service = user.service.filter(s => s.toString() !== serviceId);

        // Xóa UserService document
        const deleteResult = await UserService.deleteOne({
            user: userId,
            service: serviceId
        });

        if (deleteResult.deletedCount > 0) {
            logger.info('Deleted UserService document', {
                userId, 
                serviceId,
                adminId: req.user?._id
            });
        }

        const updatedUser = await user.save();

        const populatedUser = await User.findById(updatedUser._id)
            .populate({
                path: 'service',
                populate: [
                    { path: 'service', select: 'name slug image status description authorizedLinks' },
                    { path: 'approvedBy', select: 'name email avatar' }
                ]
            });

        return res.status(200).json({
            data: populatedUser,
            message: "Xóa dịch vụ khỏi tài khoản thành công"
        });
    } catch (error) {
        next(error);
    }
}

// Xóa dịch vụ khỏi user đang đăng nhập (profile)
export const removeServiceFromProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { serviceId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({ message: "Invalid userId or serviceId" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Xóa reference từ user
        user.service = user.service.filter(s => s.toString() !== serviceId);

        // Xóa UserService document
        const deleteResult = await UserService.deleteOne({
            user: userId,
            service: serviceId
        });

        if (deleteResult.deletedCount > 0) {
            logger.info('Deleted UserService document from profile', {
                userId, 
                serviceId
            });
        }

        const updatedUser = await user.save();

        const populatedUser = await User.findById(updatedUser._id)
            .populate({
                path: 'service',
                populate: [
                    { path: 'service', select: 'name slug image status description authorizedLinks' },
                    { path: 'approvedBy', select: 'name email avatar' }
                ]
            });

        return res.status(200).json({
            data: populatedUser,
            message: "Xóa dịch vụ khỏi tài khoản thành công"
        });
    } catch (error) {
        next(error);
    }
};

// Add new information to user
export const addUserInformation = async (req, res, next) => {
    try {
        const { code, title, description, userId } = req.body;
        const currentUser = req.user;

        // If user is admin, use the provided userId, otherwise use current user's id
        const targetUserId = currentUser.role === 'admin' ? userId : currentUser._id;

        const user = await User.findById(targetUserId);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        // Check if information with same code already exists
        const existingInfo = user.information.find(info => info.code === code);
        if (existingInfo) {
            return res.status(400).json({ message: "Mã thông tin đã tồn tại" });
        }

        user.information.push({
            code,
            title,
            description
        });

        await user.save();

        return res.status(200).json({
            data: user,
            message: "Thêm thông tin thành công"
        });
    } catch (error) {
        next(error);
    }
};

// Update user information
export const updateUserInformation = async (req, res, next) => {
    try {
        const { informationId } = req.params;
        const { code, title, description, userId } = req.body;
        const currentUser = req.user;

        // If user is admin, use the provided userId, otherwise use current user's id
        const targetUserId = currentUser.role === 'admin' ? userId : currentUser._id;

        const user = await User.findById(targetUserId);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        const infoIndex = user.information.findIndex(info => info._id.toString() === informationId);
        if (infoIndex === -1) {
            return res.status(404).json({ message: "Không tìm thấy thông tin" });
        }

        // Check if new code already exists (excluding current info)
        const existingInfo = user.information.find(
            info => info.code === code && info._id.toString() !== informationId
        );
        if (existingInfo) {
            return res.status(400).json({ message: "Mã thông tin đã tồn tại" });
        }

        user.information[infoIndex] = {
            ...user.information[infoIndex],
            code,
            title,
            description
        };

        await user.save();

        return res.status(200).json({
            data: user,
            message: "Cập nhật thông tin thành công"
        });
    } catch (error) {
        next(error);
    }
};

// Delete user information
export const deleteUserInformation = async (req, res, next) => {
    try {
        const { informationId } = req.params;
        const currentUser = req.user;

        // Find the user that contains this information
        const user = await User.findOne({
            'information._id': informationId
        });

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy thông tin cần xóa" });
        }

        // Check if user is admin or the owner of the information
        if (currentUser.role !== 'admin' && user._id.toString() !== currentUser._id.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền xóa thông tin này" });
        }

        // Remove the information
        user.information = user.information.filter(
            info => info._id.toString() !== informationId
        );

        await user.save();

        return res.status(200).json({
            data: user,
            message: "Xóa thông tin thành công"
        });
    } catch (error) {
        next(error);
    }
};

// Lấy danh sách service của user
export const getUserServices = async (req, res, next) => {
    try {
        const page = req.query.page ? +req.query.page : 1;
        const limit = req.query.limit ? +req.query.limit : 10;

        // Lấy user và populate dịch vụ đã approved
        const user = await User.findById(req.params.id)
            .populate({
                path: 'service',
         
                populate: [
                    { path: 'service', select: 'name slug image status description authorizedLinks' },
                    { path: 'approvedBy', select: 'name email avatar' }
                ]
            });

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy user" });
        }

        // Lấy toàn bộ dịch vụ đã populate
        const allServices = (user.service || []).filter(s => s.status !== 'rejected');
        const totalServices = allServices.length;
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedServices = allServices.slice(start, end);

        return res.status(200).json({
            data: {
                services: paginatedServices,
                totalServices,
                page,
                limit
            }
        });
    } catch (error) {
        next(error);
    }
};
