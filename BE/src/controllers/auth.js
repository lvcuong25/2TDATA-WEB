import pkg from "bcryptjs";
const { hashSync, compareSync } = pkg;
import User from "../model/User.js";
import { registerSchema as signUpValidator } from "../validations/auth.js";
import jwt from "jsonwebtoken";
import Service from "../model/Service.js";
import UserSession from '../model/UserSession.js';

const hashPassword = (password) => hashSync(password, 10);
const comparePassword = (password, hashPassword) => compareSync(password, hashPassword);
const token = (payload, expiresIn) => jwt.sign(payload, process.env.JWT_SECRET || process.env.SECRET_KEY, { expiresIn });

export const signUp = async (req, res, next) => {
    try {
        // Validate dữ liệu
        const { error } = signUpValidator.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessage = error.details.map(detail => detail.message);
            return res.status(400).json({
                message: errorMessage,
            });
        }

        const { email, password, role = "member", site_id, service } = req.body;

        // Check current site context
        const currentSiteId = req.site?._id?.toString();
        console.log('DEBUG signup:', {
            currentSiteId,
            reqSite: req.site?.name,
            reqSiteId: req.site?._id,
            hostname: req.hostname,
            role,
            site_id
        });
        
        // Determine final site_id assignment
        let finalSiteId = site_id;
        // If not super_admin and no site_id provided, use current site context
        if (role !== 'super_admin' && !site_id) {
            if (!currentSiteId) {
                return res.status(400).json({
                    message: "Cannot determine site context. Please specify site_id or access from a valid domain.",
                    debug: {
                        hostname: req.get('host'),
                        detectedHostname: req.detectedHostname,
                        originalHostname: req.originalHostname,
                        site: req.site ? 'detected' : 'not detected'
                    }
                });
            }
            finalSiteId = currentSiteId;
        }
        // For non-super_admin users with explicit site_id, ensure site_id matches current site
        if (role !== 'super_admin' && site_id && site_id !== currentSiteId) {
            return res.status(403).json({
                message: "Cannot create user for different site",
                error: "SITE_MISMATCH"
            });
        }

        // Kiểm tra user đã tồn tại chưa
        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(400).json({
                message: "Email đã tồn tại",
            });
        }

        const hashedPassword = hashPassword(password);
        // Prepare terms acceptance data
        const termsAcceptance = {
            agreeTermsOfService: req.body.agreeTermsOfService || false,
            agreeDataPolicy: req.body.agreeDataPolicy || false,
            agreeSecurityPolicy: req.body.agreeSecurityPolicy || false,
            acceptedAt: new Date()
        };
        const newUser = await User.create({
            ...req.body,
            password: hashedPassword,
            termsAcceptance,
            role,
            site_id: role === 'super_admin' ? null : finalSiteId,
            service: service || null
        });
        
        const accessToken = token({ _id: newUser._id }, "365d");
        return res.status(201).json({
            message: "Đăng ký thành công!",
            data: newUser,
            accessToken,
        });
    } catch (error) {
        next(error);
    }
}

export const signIn = async (req, res, next) => {
    try {
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
        
        // Tạo logic redirect thông minh dựa trên role và site
        let redirectPath = '/';
        let redirectDomain = null;
        
        // Super admin - luôn redirect về dashboard của 2tdata.com
        if (userExist.role === 'super_admin') {
            redirectPath = '/admin';
            redirectDomain = 'https://2tdata.com';
        } 
        // Site admin - redirect về dashboard của site họ quản lý
        else if (userExist.role === 'site_admin' || userExist.role === 'admin') {
            redirectPath = '/admin';
            
            // Lấy domain của site
            if (userExist.site_id && userExist.site_id.domains && userExist.site_id.domains.length > 0) {
                // Ưu tiên domain chính (domain đầu tiên)
                const primaryDomain = userExist.site_id.domains[0];
                redirectDomain = `https://${primaryDomain}`;
            }
        }
        // User thường - redirect về homepage của site họ
        else {
            // Tất cả user thường đều redirect về /service/my-service
            redirectPath = '/service/my-service';
            
            // Lấy domain của site user
            if (userExist.site_id && userExist.site_id.domains && userExist.site_id.domains.length > 0) {
                const primaryDomain = userExist.site_id.domains[0];
                redirectDomain = `https://${primaryDomain}`;
            }
        }

        return res.status(200).json({
            message: "Đăng nhập thành công!",
            accessToken,
            redirectPath,
            redirectDomain,
            data: {
                _id: userExist._id,
                email: userExist.email,
                name: userExist.name,
                role: userExist.role,
                site_id: userExist.site_id,
                service: userExist.service
            }
        });
    } catch (error) {
        next(error);
    }
}

export const logout = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const token = req.headers.authorization?.split(' ')[1];
        
        if (token) {
            await UserSession.invalidateSession(userId, token);
        }
        
        return res.status(200).json({
            message: "Đăng xuất thành công"
        });
    } catch (error) {
        next(error);
    }
}

export const resetPassword = async (req, res, next) => {
    try {
        const { email, newPassword } = req.body;
        const userExist = await User.findOne({ email });
        if (!userExist) {
            return res.status(400).json({
                message: "Email không tồn tại",
            });
        }
        const hashedPassword = hashPassword(newPassword);
        await User.findByIdAndUpdate(userExist._id, { password: hashedPassword });
        return res.status(200).json({
            message: "Reset Password thành công!",
        });
    } catch (error) {
        next(error);
    }
}

export const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userExist = await User.findById(req.user._id);
        const checkPassword = await comparePassword(oldPassword, userExist.password);
        if (!checkPassword) {
            return res.status(400).json({
                message: "Mật khẩu cũ không đúng",
            });
        }
        const hashedPassword = hashPassword(newPassword);
        await User.findByIdAndUpdate(req.user._id, { password: hashedPassword });
        return res.status(200).json({
            message: "Đổi mật khẩu thành công!",
        });
    } catch (error) {
        next(error);
    }
}

export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('site_id', 'name domains');
            
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        
        return res.status(200).json({
            data: user
        });
    } catch (error) {
        next(error);
    }
}
