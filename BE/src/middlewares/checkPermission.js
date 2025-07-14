import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../model/User.js";

dotenv.config();

const { SECRET_KEY } = process.env;

export const checkPermission = (permission) => {
    return async (req, res, next) => {
        try {
            const authorization = req.headers?.authorization;
            if (!authorization) {
                return res.status(401).json({
                    message: "Authorization header is missing",
                    error: "NO_AUTH_HEADER"
                });
            }

            if (!authorization.startsWith('Bearer ')) {
                return res.status(401).json({
                    message: "Invalid authorization format",
                    error: "INVALID_AUTH_FORMAT"
                });
            }

            const token = authorization.split(" ")[1];
            
            let decoded;
            try {
                decoded = jwt.verify(token, SECRET_KEY);
            } catch (error) {
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
            
            // Set user in request for downstream middleware and controllers
            req.user = user;
            req.userId = user._id;
            
            // Kiểm tra permission nếu được cung cấp
            if (permission) {
                // Super admin có tất cả quyền
                if (user.role === 'super_admin') {
                    return next();
                }
                
                // Mapping basic permissions
                const rolePermissions = {
                    admin: ['read', 'write', 'update', 'delete'],
                    user: ['read']
                };
                
                const userPermissions = rolePermissions[user.role] || [];
                
                if (!userPermissions.includes(permission)) {
                    return res.status(403).json({
                        message: `You do not have ${permission} permission`,
                        error: "INSUFFICIENT_PERMISSION"
                    });
                }
            }
            
            next();
        } catch (error) {
            console.error('CheckPermission middleware error:', error);
            return res.status(500).json({
                message: "Internal server error",
                error: "INTERNAL_ERROR"
            });
        }
    };
}
