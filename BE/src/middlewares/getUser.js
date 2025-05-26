import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../model/User.js";

dotenv.config();

const { SECRET_KEY } = process.env;

export const getUser = async (req, res, next) => {
    try {
        const authorization = req.headers?.authorization;
        if (!authorization) {
            return res.status(403).json({
                message: "Authorization header is missing",
            });
        }

        const token = authorization.split(" ")[1];
        const decoded = jwt.verify(token, SECRET_KEY);
        if (!decoded) {
            return res.status(403).json({
                message: "Invalid token",
            });
        }

        const user = await User.findById(decoded._id).populate('service');
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