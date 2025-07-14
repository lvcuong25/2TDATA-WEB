import User from "../model/User.js";
import Service from "../model/Service.js";
import UserSession from "../model/UserSession.js";
import { token } from "../utils/jwt.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import sendEmail from "../utils/sendEmail.js";

export const signUp = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;
        
        // Get site_id from middleware (for regular users)
        // Super admin can specify site_id in request body
        let siteId = req.siteId; // From site detection middleware
        
        // If super admin is creating user, they can specify site_id
        if (req.user?.role === 'super_admin' && req.body.site_id) {
            siteId = req.body.site_id;
        }
        
        // For non-super_admin roles, site_id is required
        if (!siteId && role !== 'super_admin') {
            return res.status(400).json({
                message: "Site ID is required for user registration",
            });
        }
        
        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(400).json({
                message: "Email đã được sử dụng",
            });
        }

        // // Kiểm tra xem service đã được gán cho user khác chưa
        // const serviceInUse = await User.findOne({ service: serviceId });
        // if (serviceInUse) {
        //     return res.status(400).json({
        //         message: "Dịch vụ này đã được gán cho người dùng khác",
        //     });
        // }

        // const service = await Service.findById(serviceId);
        // if (!service) {
        //     return res.status(400).json({
        //         message: "Dịch vụ không tồn tại",
        //     });
        // }

        const hashPasswordUser = await hashPassword(password);
        const user = await User.create({
            email,
            password: hashPasswordUser,
            role: role || 'member', // Default role is 'member'
            site_id: siteId, // Required for multi-tenant
            // service: serviceId
        });

        const accessToken = token({ _id: user._id }, "365d");
        return res.status(201).json({
            message: "Đăng ký thành công!",
            accessToken,
        });
    } catch (error) {
        next(error);
    }
};

export const signIn = async (req, res, next) => {
    try {
        console.log('🔐 SignIn attempt:', {
            email: req.body.email,
            hasPassword: !!req.body.password,
            userAgent: req.get('User-Agent'),
            origin: req.get('Origin'),
            site: req.site?.name || 'No site detected'
        });
        
        const { email, password } = req.body;
        const userExist = await User.findOne({ email }).populate('site_id');
        if (!userExist) {
            return res.status(400).json({
                message: "Email không tồn tại",
            });
        }
        if (userExist.active == false) {
            return res.status(400).json({
                message: "Người dùng không hoạt động",
            });
        }
        const checkPassword = await comparePassword(password, userExist.password);
        if (!checkPassword) {
            return res.status(400).json({
                message: "Mật khẩu không đúng",
            });
        }

        // Check site access permissions
        const currentSiteId = req.site?._id?.toString();
        const userSiteId = userExist.site_id?._id?.toString() || userExist.site_id?.toString();
        
        // Super admin can login to any site
        if (userExist.role !== 'super_admin') {
            // Other users can only login to their assigned site
            if (!userSiteId || userSiteId !== currentSiteId) {
                return res.status(403).json({
                    message: "Bạn không có quyền truy cập vào site này",
                    error: "SITE_ACCESS_DENIED"
                });
            }
        }

        const accessToken = token({ _id: userExist._id }, "365d");
        
        // Create session with site context
        const siteId = req.site?._id || userExist.site_id;
        await UserSession.createSession(
            userExist._id,
            siteId,
            accessToken,
            365 * 24 * 60 * 60 // 365 days in seconds
        );
        
        // Nếu là admin hoặc super_admin, chuyển hướng đến trang admin
        if (userExist.role === 'admin' || userExist.role === 'super_admin' || userExist.role === 'site_admin') {
            return res.status(200).json({
                message: "Đăng nhập thành công!",
                accessToken,
                redirectPath: '/admin',
                data: {
                    _id: userExist._id,
                    email: userExist.email,
                    name: userExist.name,
                    role: userExist.role,
                    site_id: userExist.site_id
                }
            });
        }

        // Nếu là user thường và chưa có service
        if (!userExist.service) {
            return res.status(200).json({
                message: "Đăng nhập thành công!",
                accessToken,
                redirectPath: '/service/my-service'
            });
        }

        // Nếu là user thường và đã có service
        return res.status(200).json({
            message: "Đăng nhập thành công!",
            accessToken,
            service: userExist.service,
            redirectPath: `/service/my-service`
        });
    } catch (error) {
        next(error);
    }
};

export const getUserByToken = async (req, res, next) => {
    try {
        const data = req.user;
        data.password = undefined;
        return res.status(200).json({ data });
    } catch (error) {
        next(error);
    }
}

export const sendOTP = async (req, res, next) => {
    try {
        const email = req.body.email;
        if (!email) {
            return res.status(400).json({
                message: "Email không được để trống!",
            });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        const checkEmail = await User.findOne({ email });
        if (!checkEmail) {
            return res.status(400).json({
                message: "Email không tồn tại!",
            });
        }
        const updateOTP = await User.findByIdAndUpdate(checkEmail.id, {
            otp: otp,
            otpCreatedAt: new Date(),
        });
        if (!updateOTP) {
            return res.status(400).json({
                message: "Có lỗi xảy ra!",
            });
        }
        if (sendEmail(checkEmail.email, "Đặt lại mật khẩu", `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
    <div style="margin:50px auto;width:70%;padding:20px 0">
    <div style="border-bottom:1px solid #eee">
        <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600"></a>
    </div>
    <p style="font-size:1.1em">Xin chào,</p>
    <p>Cảm ơn bạn đã chọn website của chúng tôi. Sử dụng OTP sau đây để hoàn tất quy trình khôi phục mật khẩu của bạn. OTP có hiệu lực trong 5 phút</p>
    <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
    <p style="font-size:0.9em;">Trân trọng,<br />
    <hr style="border:none;border-top:1px solid #eee" />
    <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
        <p></p>
        <p>Việt Nam</p>
    </div>
    </div>
</div>`)) {
            return res.status(200).json({
                message: "Gửi email thành công!",
                id: checkEmail.id,
            });
        }
        else {
            return res.status(400).json({
                message: "Gửi email thất bại!",
            });
        }
    }
    catch (error) {
        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { email, password, otp, cPassword } = req.body;
        if(password !== cPassword) {
            return res.status(400).json({
                message: "Mật khẩu không trùng khớp!",
            });
        }
        const checkUser = await User.findOne({ email });
        if (!checkUser) {
            return res.status(400).json({
                message: "Người dùng không tồn tại!",
            });
        }
        if (checkUser.otp === null || checkUser.otpCreatedAt === null) {
            return res.status(400).json({
                message: "Bạn chưa gửi OTP!",
            });
        }
        if (checkUser.otp !== otp) {
            return res.status(400).json({
                message: "OTP không đúng!",
            });
        }
        const otpCreatedAt = new Date(checkUser.otpCreatedAt);
        const now = new Date();
        const diff = Math.abs(now - otpCreatedAt);
        const diffMinutes = Math.floor((diff / 1000) / 60);
        if (diffMinutes > 60) {
            return res.status(400).json({
                message: "OTP đã hết hạn!",
            });
        }
        const hashPasswordUser = await hashPassword(password);
        const updatePassword = await User.findByIdAndUpdate(checkUser.id, {
            password: hashPasswordUser,
        });
        if (!updatePassword) {
            return res.status(400).json({
                message: "Có lỗi xảy ra!",
            });
        }
        const removeOTP = await User.findByIdAndUpdate(checkUser.id, {
            otp: null,
            otpCreatedAt: null,
        });
        if (!removeOTP) {
            return res.status(400).json({
                message: "Có lỗi xảy ra!",
            });
        }
        const accessToken = token({ _id: checkUser.id }, "365d");
        return res.status(201).json({
            message: "Đặt lại mật khẩu thành công!",
            accessToken,
        });
    }
    catch (error) {
        next(error);
    }
}

export const changePassword = async (req, res, next) => {
    try {
        const data = req.user;
        const { oldPassword, newPassword } = req.body;
        const checkPassword = await comparePassword(oldPassword, data.password);
        if (!checkPassword) {
            return res.status(400).json({
                message: "Mật khẩu cũ không đúng!",
            });
        }
        const hashPasswordUser = await hashPassword(newPassword);
        const updatePassword = await User.findByIdAndUpdate(data.id, {
            password: hashPasswordUser,
        });
        if (!updatePassword) {
            return res.status(400).json({
                message: "Có lỗi xảy ra!",
            });
        }
        return res.status(200).json({
            message: "Đổi mật khẩu thành công!",
        });
    }
    catch (error) {
        next(error);
    }
}