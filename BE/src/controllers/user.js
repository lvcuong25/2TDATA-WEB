import mongoose from "mongoose";
import User from "../model/User.js";
import { hashPassword } from "../utils/password.js";


export const getAllUser = async (req, res, next) => {
    try {
        const options = {
            page: req.query.page ? +req.query.page : 1,
            limit: req.query.limit ? +req.query.limit : 10,
            sort: req.query.sort ? req.query.sort : { createdAt: -1 },
            populate: {
                path: 'service',
                populate: [
                    { path: 'service', select: 'name slug image status description' },
                    { path: 'approvedBy', select: 'name email avatar' }
                ]
            }
        };
        let query = {};
        if (req.query.name) {
            query.name = { $regex: new RegExp(req.query.name, 'i') };
        }
        if (req.query.email) {
            query.email = { $regex: new RegExp(req.query.email, 'i') };
        }
        if (req.query.role) {
            query.role = req.query.role;
        }
        if (req.query.address) {
            query.address = { $regex: new RegExp(req.query.address, 'i') };
        }
        if (req.query.phone) {
            query.phone = { $regex: new RegExp(req.query.phone, 'i') };
        }
        if (req.query.active) {
            query.active = req.query.active;
        }
        const data = await User.paginate(query, options);
        return !data ? res.status(400).json({ message: "Get all user failed" }) : res.status(200).json({ data })
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
                    { path: 'service', select: 'name slug image status description' },
                    { path: 'approvedBy', select: 'name email avatar' }
                ]
            });
        return !data ? res.status(500).json({ message: "Get user by id failed" }) : res.status(200).json({ data });
    }
    catch (error) {
        next(error);
    }
}

export const createUser = async (req, res, next) => {
    try {
        req.body.password = await hashPassword(req.body.password);
        const data = await User.create(req.body);
        return !data ? res.status(500).json({ message: "Tạo user thất bại" }) : res.status(201).json({ data });
    } catch (error) {
        next(error);
    }
}

export const removeUserById = async (req, res, next) => {
    try {
        const data = await User.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
        return !data ? res.status(500).json({ message: "Vô hiệu hóa người dùng thất bại" }) : res.status(200).json({ data, message: "Vô hiệu hóa người dùng thành công!" });
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        // If updating services, validate and convert to ObjectIds
        if (req.body.service) {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Ensure service is an array of objects with id and status
            const newServices = Array.isArray(req.body.service) ? req.body.service : [req.body.service];
            
            // Create UserService documents for each service
            const UserService = mongoose.model('UserService');
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
                    // Create new service with default 'waiting' status
                    const newUserService = await UserService.create({
                        user: req.params.id,
                        service: service.id,
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
                { path: 'service', select: 'name slug image status description' },
                { path: 'approvedBy', select: 'name email avatar' }
            ]
        });

        return !data ? 
            res.status(500).json({ message: "Cập nhật thông tin thất bại!" }) : 
            res.status(200).json({ data, message: "Cập nhật thông tin thành công" });
    } catch (error) {
        next(error);
    }
}

export const restoreUserById = async (req, res, next) => {
    try {
        const data = await User.findByIdAndUpdate(req.params.id, { active: true }, { new: true });
        return !data ? res.status(500).json({ message: "Khôi phục người dùng thất bại" }) : res.status(200).json({ data, message: "Khôi phục người dùng thành công" });
    } catch (error) {
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
                { path: 'service', select: 'name slug image status description' },
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

        user.service = user.service.filter(s => s.toString() !== serviceId);

        const updatedUser = await user.save();

        const populatedUser = await User.findById(updatedUser._id)
            .populate({
                path: 'service',
                populate: [
                    { path: 'service', select: 'name slug image status description' },
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

        user.service = user.service.filter(s => s.toString() !== serviceId);

        const updatedUser = await user.save();

        const populatedUser = await User.findById(updatedUser._id)
            .populate({
                path: 'service',
                populate: [
                    { path: 'service', select: 'name slug image status description' },
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