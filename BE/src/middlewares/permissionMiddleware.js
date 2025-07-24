import { sendError } from '../utils/responseHelper.js';

/**
 * Hardcoded permissions based on roles
 */
const rolePermissions = {
  super_admin: ['*'], // All permissions
  site_admin: [
    'site.read',
    'site.update', // Only for their own site
    'user.create',
    'user.read',
    'user.update',
    'user.delete',
    'analytics.read',
    'content.create',
    'content.read',
    'content.update',
    'content.delete',
    'userservice.read',
    'userservice.update',
    'userservice.delete',
    'orgservice.read',
    'orgservice.update',
    'orgservice.delete',
    'org.read',
    'org.create',
    'org.update',
    'org.delete',
    'blog.read',
    'blog.create',
    'blog.update',
    'blog.delete',
    'iframe.read',
    'iframe.create',
    'iframe.update',
    'iframe.delete'
  ],
  site_moderator: [
    'user.read',
    'content.read',
    'content.create',
    'content.update',
    'analytics.read'
  ],
  member: [
    'user.read',
    'content.read'
  ]
};

/**
 * Check if user has specific permission(s)
 */
export const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'UNAUTHORIZED'
        });
      }
      
      // Get user permissions based on role
      const userPermissions = rolePermissions[req.user.role] || [];
      
      // Store permissions in request for later use
      req.userPermissions = userPermissions;
      
      // Wildcard check for super_admin
      if (userPermissions.includes('*')) {
        return next();
      }
      
      // Special handling for site_admin
      if (req.user.role === 'site_admin') {
        // Site admins cannot create or delete sites
        if (requiredPermissions.includes('site.create') || 
            requiredPermissions.includes('site.delete')) {
          return res.status(403).json({
            success: false,
            message: 'Site admins cannot create or delete sites',
            error: 'INSUFFICIENT_PERMISSIONS'
          });
        }
        
        // Additional check for site-specific operations
        if (requiredPermissions.includes('site.update')) {
          const siteId = req.params.id || req.params.siteId;
          if (siteId && req.user.site_id) {
            // Allow if they're updating their own site
            if (siteId.toString() !== req.user.site_id.toString()) {
              return res.status(403).json({
                success: false,
                message: 'You can only update your own site',
                error: 'SITE_ACCESS_DENIED'
              });
            }
          }
        }
      }
      
      // Check if user has required permissions
      const hasPermission = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Required permissions: ${requiredPermissions.join(', ')}`,
          error: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error.message
      });
    }
  };
};

/**
 * Check if user has any of the specified permissions
 */
export const requireAnyPermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401);
      }
      
      // Get user permissions based on role
      const userPermissions = rolePermissions[req.user.role] || [];
      req.userPermissions = userPermissions;
      
      // Wildcard check for super_admin
      if (userPermissions.includes('*')) {
        return next();
      }
      
      // Check if user has any of the required permissions
      const hasPermission = permissions.some(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        return sendError(res, 
          `Required one of: ${permissions.join(', ')}`, 
          403
        );
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return sendError(res, 'Permission check failed', 500);
    }
  };
};

/**
 * Apply data isolation based on site context
 */
export const applySiteIsolation = (req, res, next) => {
  // Skip for super admin - they can see all data
  if (req.user?.role === 'super_admin') {
    // Check if super admin wants to filter by specific site
    const filterSiteId = req.query.site_id || req.headers['x-site-id'];
    if (filterSiteId) {
      req.siteFilter = { site_id: filterSiteId };
    } else {
      req.siteFilter = {}; // No filter for super admin by default
    }
    return next();
  }
  
  // Apply site filter for others
  if (req.user?.site_id) {
    req.siteFilter = { site_id: req.user.site_id };
  } else if (req.site?._id) {
    req.siteFilter = { site_id: req.site._id };
  } else {
    req.siteFilter = {};
  }
  
  // Helper function to apply filter to queries
  req.applyFilter = (query = {}) => {
    return { ...query, ...req.siteFilter };
  };
  
  next();
};

export default {
  requirePermission,
  requireAnyPermission,
  applySiteIsolation
};
