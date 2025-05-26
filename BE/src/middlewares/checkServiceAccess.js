import User from "../model/User.js";
import Service from "../model/Service.js";

export const checkServiceAccess = async (req, res, next) => {
    try {
        const { id, slug } = req.params;
        const serviceIdentifier = id || slug;

        // Nếu là admin, cho phép truy cập tất cả service
        if (req.user.role === 'admin') {
            let service;
            if (id) {
                service = await Service.findById(id);
            } else if (slug) {
                service = await Service.findOne({ slug });
            }

            if (!service) {
                return res.status(404).json({
                    message: "Không tìm thấy dịch vụ"
                });
            }
            req.service = service;
            return next();
        }

        // Nếu là user thường, kiểm tra service của họ
        const user = await User.findById(req.user._id).populate('service');
        
        // Nếu user không có service, không cho phép truy cập
        if (!user.service) {
            return res.status(403).json({
                message: "Bạn chưa được gán dịch vụ nào"
            });
        }

        // Kiểm tra xem service user đang cố truy cập có phải là service của họ không
        let hasAccess = false;
        if (id) {
            hasAccess = user.service._id === id;
        } else if (slug) {
            hasAccess = user.service.slug === slug;
        }

        if (!hasAccess) {
            return res.status(403).json({
                message: "Bạn chỉ có thể truy cập dịch vụ đã được gán cho tài khoản của bạn"
            });
        }

        // Thêm thông tin service vào request để sử dụng ở các middleware tiếp theo
        req.service = user.service;
        next();
    } catch (error) {
        console.error('Error in checkServiceAccess:', error);
        next(error);
    }
}; 