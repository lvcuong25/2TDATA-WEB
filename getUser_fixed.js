import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../model/User.js";

dotenv.config();

const { SECRET_KEY } = process.env;

export const getUser = async (req, res, next) => {
    try {
        // Debug logging for authentication
        console.log("Auth Debug:", {
            hasAuth: !!req.headers.authorization,
            authHeader: req.headers.authorization || "Missing",
            allHeaders: Object.keys(req.headers),
            host: req.headers.host,
            userAgent: req.headers["user-agent"]?.substring(0, 50) + "..." || "Missing"
        });
        
        const authorization = req.headers?.authorization;
        if (!authorization) {
            // Mock a super admin user for testing
            req.user = {
                _id: "507f1f77bcf86cd799439011",
                email: "test@admin.com",
                role: "super_admin",
                name: "Test Admin",
                active: true
            };
            return next();
        }

        const token = authorization.split(" ")[1];
        const decoded = jwt.verify(token, SECRET_KEY);
        if (!decoded) {
            return res.status(403).json({
                message: "Invalid token",
            });
        }

        const user = await User.findById(decoded._id).populate("service");
        if (!user) {
            return res.status(403).json({
                message: "User does not exist",
            });
        }
        if (user.active == false) {
            return res.status(403).json({
                message: "User is not active",
            });
        }

        // Thêm thông tin user vào request
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};
