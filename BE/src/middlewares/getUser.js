import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../model/User.js";

dotenv.config();

const { SECRET_KEY, JWT_SECRET } = process.env;

export const getUser = async (req, res, next) => {
    try {
        let token = null;
        
        // Check Authorization header first
        const authorization = req.headers?.authorization;
        if (authorization && authorization.startsWith('Bearer ')) {
            token = authorization.split(" ")[1];
        }
        
        // If no token in header, check cookie
        if (!token && req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }
        
        // Không có token - set user là null và tiếp tục
        if (!token) {
            req.user = null;
            return next();
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET || SECRET_KEY);
        } catch (error) {
            // Token không hợp lệ hoặc hết hạn
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    message: "Invalid token",
                    error: "INVALID_TOKEN"
                });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: "Token expired",
                    error: "TOKEN_EXPIRED"
                });
            }
            throw error;
        }

        // Tìm user từ decoded token
        const user = await User.findById(decoded._id).populate('service').populate('site_id').lean();
        
        if (!user) {
            return res.status(403).json({
                message: "User does not exist",
                error: "USER_NOT_FOUND"
            });
        }
        
        if (user.active === false) {
            return res.status(403).json({
                message: "User is not active",
                error: "USER_INACTIVE"
            });
        }

        // Thêm thông tin user vào request
        req.user = user;
        req.userId = user._id;
        
        next();
    } catch (error) {
        console.error('GetUser middleware error:', error);
        return res.status(500).json({
            message: "Internal server error",
            error: "INTERNAL_ERROR"
        });
    }
};
