import Service from "../model/Service.js";
import User from "../model/User.js";
import UserService from "../model/UserService.js";

// Lấy danh sách dịch vụ
export const getServices = async (req, res, next) => {
    try {
        const page = req.query.page ? +req.query.page : 1;
        const limit = req.query.limit ? +req.query.limit : 10;
        const sort = req.query.sort ? req.query.sort : { createdAt: -1 };

        let query = {};
        if (req.query.name) {
            query.$or = [
                { name: { $regex: new RegExp(req.query.name, 'i') } },
                { slug: { $regex: new RegExp(req.query.name, 'i') } }
            ];
        }
        if (req.query.status) {
            query.status = req.query.status;
        }

        const data = await Service.paginate(query, { page, limit, sort });
        return res.status(200).json({ data });
    } catch (error) {
        next(error);
    }
};

// Lấy chi tiết một dịch vụ theo ID
export const getServiceById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Nếu là admin, cho phép xem bất kỳ service nào
        if (req.user.role === 'admin') {
            const service = await Service.findById(id);
            if (!service) {
                return res.status(404).json({
                    message: "Không tìm thấy dịch vụ"
                });
            }
            return res.status(200).json(service);
        }

        // Nếu là user thường, kiểm tra danh sách service được gán
        const user = await User.findById(req.user._id).populate('service');

        if (!user.service || user.service.length === 0) {
            return res.status(403).json({
                message: "Bạn chưa được gán dịch vụ nào"
            });
        }

        const matchedService = user.service.find(s => s._id.toString() === id);
        if (!matchedService) {
            return res.status(403).json({
                message: "Bạn chỉ có thể truy cập dịch vụ đã được gán cho tài khoản của bạn"
            });
        }

        return res.status(200).json(matchedService);
    } catch (error) {
        next(error);
    }
};


// Lấy chi tiết một dịch vụ theo slug
export const getServiceBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const userId = req.user._id;

        // Lấy thông tin user và populate danh sách service
        const user = await User.findById(userId).populate('service');

        // Nếu là admin, cho phép xem bất kỳ service nào
        if (req.user.role === 'admin') {
            const service = await Service.findOne({ slug });
            if (!service) {
                return res.status(404).json({
                    message: "Không tìm thấy dịch vụ"
                });
            }
            return res.status(200).json(service);
        }

        // Nếu là user thường, kiểm tra danh sách service được gán
        if (!user.service || user.service.length === 0) {
            return res.status(403).json({
                message: "Bạn chưa được gán dịch vụ nào"
            });
        }

        const matchedService = user.service.find(s => s.slug === slug);
        if (!matchedService) {
            return res.status(403).json({
                message: "Bạn chỉ có thể truy cập dịch vụ đã được gán cho tài khoản của bạn"
            });
        }

        return res.status(200).json(matchedService);
    } catch (error) {
        next(error);
    }
};


// Tạo dịch vụ mới
export const createService = async (req, res, next) => {
    try {
        const { name, description, image, slug, authorizedLinks } = req.body;
        
        // Kiểm tra dịch vụ đã tồn tại
        const serviceExist = await Service.findOne({ name });
        if (serviceExist) {
            return res.status(400).json({
                message: "Dịch vụ đã tồn tại",
            });
        }

        // Validate link data
        if (authorizedLinks && !Array.isArray(authorizedLinks)) {
            return res.status(400).json({
                message: "Link phải là một mảng",
            });
        }

        // Filter out empty links and format link data
        const filteredLinks = authorizedLinks ? authorizedLinks
            .filter(link => link.url && link.url.trim() !== '')
            .map(link => ({
                url: link.url.trim(),
                title: link.title?.trim() || '',
                description: link.description?.trim() || ''
            })) : [];

        const service = await Service.create({
            name,
            description,
            image,
            slug,
            authorizedLinks: filteredLinks
        });

        return res.status(201).json({
            message: "Tạo dịch vụ thành công",
            service
        });
    } catch (error) {
        next(error);
    }
};

// Cập nhật dịch vụ
export const updateService = async (req, res, next) => {
    try {
        const { name, description, image, status, slug, authorizedLinks } = req.body;
        
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                image,
                status,
                slug,
                authorizedLinks
            },
            { new: true }
        );

        if (!service) {
            return res.status(404).json({
                message: "Không tìm thấy dịch vụ",
            });
        }

        return res.status(200).json({
            message: "Cập nhật dịch vụ thành công",
            service
        });
    } catch (error) {
        next(error);
    }
};

// Xóa dịch vụ
export const deleteService = async (req, res, next) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        
        if (!service) {
            return res.status(404).json({
                message: "Không tìm thấy dịch vụ",
            });
        }

        return res.status(200).json({
            message: "Xóa dịch vụ thành công"
        });
    } catch (error) {
        next(error);
    }
};

// Thêm service vào user (sẽ ở trạng thái chờ xác nhận)
export const addServiceToUser = async (req, res, next) => {
    try {
        const { serviceId, customSlug, link } = req.body;
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
                customSlug: customSlug, // Nếu có customSlug được cung cấp
                link: link || [] // Thêm link nếu có
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