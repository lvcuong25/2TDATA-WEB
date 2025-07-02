import Site from '../model/Site.js';

/**
 * Middleware để detect site từ domain/hostname
 * Thêm site info vào request object
 */
export const detectSiteMiddleware = async (req, res, next) => {
  console.log('🔍 detectSiteMiddleware called for:', req.path);
  try {
    // Lấy hostname từ header (check X-Host first for frontend requests)
    let hostname = req.get('x-host') || req.get('host') || req.hostname;
    
    console.log('🔍 Site detection debug:', {
      'x-host': req.get('x-host'),
      'host': req.get('host'),
      'hostname': req.hostname,
      'final_hostname': hostname,
      'path': req.path,
      'url': req.url
    });
    
    // Remove port nếu có (localhost:3000 -> localhost)
    const originalHostname = hostname;
    hostname = hostname.split(':')[0];
    
    console.log(`🌐 Processing hostname: ${originalHostname} -> ${hostname}`);
    
    // Tìm site theo domain trước - sử dụng direct query thay vì findByDomain
    let site = await Site.findOne({ 
      domains: { $in: [hostname] },
      status: 'active' 
    });
    console.log(`🔍 Direct lookup for "${hostname}": ${site ? `Found "${site.name}"` : 'Not found'}`);
    
    // Nếu không tìm thấy và đang ở localhost environment, thử các cách khác
    if (!site && (hostname.includes('localhost') || hostname === '127.0.0.1')) {
      console.log('🔍 Localhost detected, trying alternative detection methods...');
      
      // Đầu tiên, thử tìm exact match với các cách khác nhau
      console.log('🔧 Trying exact domain search for:', hostname);
      
      // Try alternative localhost patterns
      const localhostPatterns = [
        hostname, // exact match
        hostname.replace('.localhost', ''), // without .localhost suffix
        `${hostname}.localhost` // with .localhost suffix
      ].filter(Boolean);
      
      for (const pattern of localhostPatterns) {
        console.log(`   Testing pattern: "${pattern}"`);
        site = await Site.findOne({ 
          domains: { $in: [pattern] },
          status: 'active' 
        });
        if (site) {
          console.log(`   ✅ Found site "${site.name}" with pattern "${pattern}"`);
          break;
        }
      }
      
      // Debug: List all available sites if still not found
      if (!site) {
        console.log('🔍 Still not found, listing all available sites:');
        const allSites = await Site.find({ status: 'active' });
        console.log('   Available sites and domains:');
        for (const s of allSites) {
          console.log(`     - ${s.name}: [${s.domains.join(', ')}]`);
        }
      }
      
      // Cuối cùng, nếu hostname chính xác là 'localhost', lấy main site
      if (!site && (hostname === 'localhost' || hostname === '127.0.0.1')) {
        console.log('🏠 Using main site for bare localhost');
        site = await Site.findOne({ 
          $or: [
            { domains: 'localhost' },
            { domains: '2tdata.com' },
            { name: /main|master|2tdata/i }
          ],
          status: 'active' 
        }).sort({ createdAt: 1 });
        console.log(`   Main site fallback: ${site ? `Found "${site.name}"` : 'Not found'}`);
      }
      
      if (site) {
        req.isDevelopment = true;
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
      const statusMessages = {
        'inactive': 'This site is currently inactive',
        'suspended': 'This site has been suspended'
      };
      
      return res.status(403).json({
        success: false,
        message: statusMessages[site.status] || 'Site is not accessible',
        error: 'SITE_NOT_ACCESSIBLE'
      });
    }
    
    // Thêm site info vào request
    req.site = site;
    req.siteId = site._id;
    req.siteFilter = { site_id: site._id };
    req.domain = hostname;
    
    // Update last activity
    site.stats.lastActivity = new Date();
    await site.save();
    
    next();
  } catch (error) {
    console.error('Site detection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during site detection',
      error: 'SITE_DETECTION_ERROR'
    });
  }
};

/**
 * Middleware để auto-apply site filter cho tất cả queries
 * Sử dụng sau detectSiteMiddleware
 */
export const applySiteFilterMiddleware = (req, res, next) => {
  // Chỉ áp dụng nếu có siteFilter
  if (req.siteFilter) {
    // Store original query methods
    const originalFind = req.query;
    const originalBody = req.body;
    
    // Modify req để auto-inject site_id filter
    req.autoSiteFilter = req.siteFilter;
    
    // Helper function to add site filter to query objects
    req.addSiteFilter = (query = {}) => {
      return { ...query, ...req.siteFilter };
    };
  }
  
  next();
};

/**
 * Middleware để check super admin permissions
 * Super admin có thể bypass site restrictions
 */
export const checkSuperAdminMiddleware = (req, res, next) => {
  // Nếu user là super_admin, cho phép switch site thông qua header
  if (req.user && req.user.role === 'super_admin') {
    const switchSiteId = req.get('x-site-id');
    
    if (switchSiteId) {
      // Super admin đang switch sang site khác
      req.siteId = switchSiteId;
      req.siteFilter = { site_id: switchSiteId };
      req.isSuperAdminSwitch = true;
    }
    
    req.isSuperAdmin = true;
  }
  
  next();
};

/**
 * Middleware để check site admin permissions
 */
export const checkSiteAdminMiddleware = (req, res, next) => {
  if (!req.user || !req.site) {
    return next();
  }
  
  // Check if user is site admin for current site
  const isSiteAdmin = req.site.isSiteAdmin(req.user._id);
  const siteAdminRole = req.site.getSiteAdminRole(req.user._id);
  
  if (isSiteAdmin) {
    req.isSiteAdmin = true;
    req.siteAdminRole = siteAdminRole;
    
    // Get site admin permissions
    const siteAdmin = req.site.site_admins.find(admin => 
      admin.user_id.toString() === req.user._id.toString()
    );
    req.siteAdminPermissions = siteAdmin ? siteAdmin.permissions : [];
  }
  
  next();
};

/**
 * Helper middleware để require site admin permissions
 */
export const requireSiteAdmin = (requiredPermissions = []) => {
  return (req, res, next) => {
    // Super admin có quyền truy cập mọi thứ
    if (req.isSuperAdmin) {
      return next();
    }
    
    // Check if user is site admin
    if (!req.isSiteAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Site admin access required',
        error: 'SITE_ADMIN_REQUIRED'
      });
    }
    
    // Check specific permissions if required
    if (requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(permission => 
        req.siteAdminPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Required permissions: ${requiredPermissions.join(', ')}`,
          error: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    }
    
    next();
  };
};

/**
 * Helper middleware để require super admin
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required',
      error: 'SUPER_ADMIN_REQUIRED'
    });
  }
  
  next();
};

export default {
  detectSiteMiddleware,
  applySiteFilterMiddleware,
  checkSuperAdminMiddleware,
  checkSiteAdminMiddleware,
  requireSiteAdmin,
  requireSuperAdmin
};
