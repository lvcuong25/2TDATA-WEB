import Service from "../model/Service.js";
import User from "../model/User.js";

// Lấy danh sách dịch vụ
export const getServices = async (req, res, next) => {
    try {
        const services = await Service.find();
        return res.status(200).json(services);
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
        const { name, description, image, slug } = req.body;
        
        // Kiểm tra dịch vụ đã tồn tại
        const serviceExist = await Service.findOne({ name });
        if (serviceExist) {
            return res.status(400).json({
                message: "Dịch vụ đã tồn tại",
            });
        }

        const service = await Service.create({
            name,
            description,
            image,
            slug
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
        const { name, description, image, status, slug } = req.body;
        
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                image,
                status,
                slug
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