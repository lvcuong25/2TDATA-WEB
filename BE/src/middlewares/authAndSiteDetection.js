import jwt from "jsonwebtoken";
import User from "../model/User.js";
import Site from "../model/Site.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Middleware kết hợp auth và site detection
 * Thực hiện auth trước, sau đó detect site
 */
export const authAndSiteDetectionMiddleware = async (req, res, next) => {
    try {
        // 1. Auth Detection
        const authorization = req.headers?.authorization;
        
        if (authorization && authorization.startsWith('Bearer ')) {
            try {
                const token = authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SECRET_KEY);
                
                // Lấy thông tin user
                const user = await User.findById(decoded._id)
                    .select('-password')
                    .populate('site_id');
                    
                if (user) {
                    req.user = user;
                }
            } catch (error) {
                // Token không hợp lệ, tiếp tục với user = null
                console.log('Invalid token:', error.message);
                req.user = null;
            }
        } else {
            req.user = null;
        }

        // 2. Site Detection
        let hostname = req.get('x-host') || req.get('host') || req.hostname;
        const originalHostname = hostname;
        hostname = hostname.split(':')[0];
        
        // Tìm site theo domain
        let site = await Site.findOne({ 
            domains: { $in: [hostname] },
            status: 'active' 
        });

        // Fallback logic nếu không tìm thấy site
        if (!site) {
            // Nếu là localhost hoặc IP, tìm site default
            if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
                site = await Site.findOne({ 
                    $or: [
                        { domains: { $in: ['2tdata.com'] } },
                        { domains: { $in: ['localhost'] } },
                        { isDefault: true }
                    ],
                    status: 'active' 
                }).sort({ createdAt: 1 });
            }
        }

        // Set site vào request
        req.site = site;
        req.detectedHostname = hostname;
        req.originalHostname = originalHostname;
        
        next();
    } catch (error) {
        console.error('Error in authAndSiteDetectionMiddleware:', error);
        next(error);
    }
};
