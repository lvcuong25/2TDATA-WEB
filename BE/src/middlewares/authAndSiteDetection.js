import jwt from 'jsonwebtoken';
import User from '../model/User.js';
import Site from '../model/Site.js';

/**
 * Combined middleware để xử lý authentication và site detection
 * Đảm bảo super_admin có thể truy cập mọi site
 */
export const authAndSiteDetectionMiddleware = async (req, res, next) => {
  try {
    // Bước 1: Authentication (nếu có token)
    let token = null;
    
    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // If no token in header, check cookie
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || process.env.SECRET_KEY);
        req.user = await User.findById(payload._id).select('-password').populate('service').populate('site_id');
        
        if (!req.user) {
          return res.status(401).json({ message: 'Authentication invalid' });
        }
        
        if (req.user.active === false) {
          return res.status(403).json({
            message: "User is not active",
            error: "USER_INACTIVE"
          });
        }
      } catch (error) {
        // Token không hợp lệ, tiếp tục như anonymous user
        console.log('Invalid token:', error.message);
        req.user = null; // Đảm bảo req.user là null khi token không hợp lệ
      }
    } else {
      // Không có token, set user là null
      req.user = null;
    }
    
    // Bước 2: Site Detection
    let hostname = req.get('x-host') || req.get('host') || req.hostname;
    hostname = hostname.split(':')[0];
    
    // SUPER ADMIN LOGIC - Cho phép truy cập mọi site
    if (req.user && req.user.role === 'super_admin') {
      const switchSiteId = req.get('x-site-id');
      
      let site;
      if (switchSiteId) {
        // Super admin switch sang site cụ thể
        site = await Site.findById(switchSiteId);
      } else {
        // Tìm site theo domain
        site = await Site.findOne({ 
          domains: { $in: [hostname] }
        });
        
        // Thử các pattern khác nếu không tìm thấy
        if (!site && (hostname.includes('localhost') || hostname === '127.0.0.1')) {
          const patterns = [
            hostname,
            hostname.replace('.localhost', ''),
            `${hostname}.localhost`
          ];
          
          for (const pattern of patterns) {
            site = await Site.findOne({ domains: { $in: [pattern] } });
            if (site) break;
          }
        }
      }
      
      // Nếu vẫn không tìm thấy, lấy site đầu tiên
      if (!site) {
        site = await Site.findOne({}).sort({ createdAt: 1 });
      }
      
      if (site) {
        // Super admin có thể truy cập mọi site bất kể status
        req.site = site;
        req.siteId = site._id;
        req.siteFilter = { site_id: site._id };
        req.domain = hostname;
        req.isSuperAdmin = true;
        req.isSuperAdminSwitch = !!switchSiteId;
        
        // Set site admin permissions for super admin
        req.isSiteAdmin = true;
        req.siteAdminRole = 'super_admin';
        req.siteAdminPermissions = ['all'];
        
        return next();
      }
    }
    
    // REGULAR USER LOGIC
    let site = await Site.findOne({ 
      domains: { $in: [hostname] },
      status: 'active' 
    });
    
    // Thử các pattern khác cho localhost
    if (!site && (hostname.includes('localhost') || hostname === '127.0.0.1')) {
      const patterns = [
        hostname,
        hostname.replace('.localhost', ''),
        `${hostname}.localhost`
      ];
      
      for (const pattern of patterns) {
        site = await Site.findOne({ 
          domains: { $in: [pattern] },
          status: 'active' 
        });
        if (site) break;
      }
      
      if (!site && (hostname === 'localhost' || hostname === '127.0.0.1')) {
        site = await Site.findOne({ 
          $or: [
            { domains: 'localhost' },
            { domains: '2tdata.com' },
            { name: /main|master|2tdata/i }
          ],
          status: 'active' 
        }).sort({ createdAt: 1 });
      }
    }
    
    if (!site) {
      return res.status(404).json({
        success: false,
        message: `Site not found for domain: ${hostname}`,
        error: 'SITE_NOT_FOUND'
      });
    }
    
    // Kiểm tra site status
    if (site.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Site is not accessible',
        error: 'SITE_NOT_ACCESSIBLE'
      });
    }
    
    // Set site info
    req.site = site;
    req.siteId = site._id;
    req.siteFilter = { site_id: site._id };
    req.domain = hostname;
    
    // Check if user is site admin
    if (req.user && site.site_admins) {
      const siteAdmin = site.site_admins.find(admin => 
        admin.user_id.toString() === req.user._id.toString()
      );
      
      if (siteAdmin) {
        req.isSiteAdmin = true;
        req.siteAdminRole = siteAdmin.role;
        req.siteAdminPermissions = siteAdmin.permissions || [];
      }
    }
    
    next();
  } catch (error) {
    console.error('Auth and site detection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'AUTH_SITE_DETECTION_ERROR'
    });
  }
};

export default authAndSiteDetectionMiddleware;
