import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../model/User.js";

dotenv.config();

const { SECRET_KEY } = process.env;

export const getUser = async (req, res, next) => {
    try {
        const authorization = req.headers?.authorization;
        
        // Không có authorization header - set user là null và tiếp tục
        if (!authorization) {
            req.user = null;
            return next();
        }

        // Kiểm tra format của authorization header
        if (!authorization.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authorization.split(" ")[1];
        
        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, SECRET_KEY);
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
        const user = await User.findById(decoded._id).populate('service').populate('site_id');
        
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
