import Permission from '../model/Permission.js';
import RolePermission from '../model/RolePermission.js';
import { sendError } from '../utils/responseHelper.js';

/**
 * Cache for role permissions to avoid repeated DB queries
 */
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get permissions for a role (with caching)
 */
async function getRolePermissions(role, siteId = null) {
  const cacheKey = `${role}_${siteId || 'global'}`;
  const cached = permissionCache.get(cacheKey);
  
  if (cached && cached.expires > Date.now()) {
    return cached.permissions;
  }
  
  // Query permissions
  const query = { role };
  if (siteId) {
    query.$or = [
      { site_id: siteId },
      { site_id: null } // Global permissions
    ];
  }
  
  const rolePermissions = await RolePermission.find(query)
    .populate('permission_id')
    .lean();
  
  const permissions = rolePermissions.map(rp => rp.permission_id.name);
  
  // Cache the result
  permissionCache.set(cacheKey, {
    permissions,
    expires: Date.now() + CACHE_TTL
  });
  
  return permissions;
}

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
      
      // Super admin bypass - has all permissions
      if (req.user.role === 'super_admin') {
        req.userPermissions = ['*']; // Wildcard for all permissions
        return next();
      }
      
      // For now, use hardcoded permissions based on role
      // until RolePermission collection is populated
      let userPermissions = [];
      
      if (req.user.role === 'site_admin') {
        // Site admin permissions
        userPermissions = [
          'site.read',
          'site.update', // Only for their own site
          'user.create',
          'user.read',
          'user.update',
          'user.delete',
          'analytics.read'
        ];
        
        // Additional check for site-specific operations
        if (requiredPermissions.includes('site.update')) {
          // Check if they're updating their own site
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
        
        // Site admins cannot create or delete sites
        if (requiredPermissions.includes('site.create') || 
            requiredPermissions.includes('site.delete')) {
          return res.status(403).json({
            success: false,
            message: 'Site admins cannot create or delete sites',
            error: 'INSUFFICIENT_PERMISSIONS'
          });
        }
      } else if (req.user.role === 'admin') {
        userPermissions = [
          'user.read',
          'user.update',
          'analytics.read'
        ];
      } else if (req.user.role === 'member') {
        userPermissions = ['user.read'];
      }
      
      // Try to get from database if available
      try {
        const dbPermissions = await getRolePermissions(
          req.user.role,
          req.user.site_id || req.site?._id
        );
        if (dbPermissions && dbPermissions.length > 0) {
          userPermissions = dbPermissions;
        }
      } catch (err) {
        // Use hardcoded permissions if DB fails
      }
      
      // Store permissions in request for later use
      req.userPermissions = userPermissions;
      
      // Check if user has required permissions
      const hasPermission = requiredPermissions.every(permission => 
        userPermissions.includes(permission) || userPermissions.includes('*')
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
      
      // Super admin bypass
      if (req.user.role === 'super_admin') {
        req.userPermissions = ['*'];
        return next();
      }
      
      // Get user's permissions
      const userPermissions = await getRolePermissions(
        req.user.role,
        req.user.site_id || req.site?._id
      );
      
      req.userPermissions = userPermissions;
      
      // Check if user has any of the required permissions
      const hasPermission = permissions.some(permission => 
        userPermissions.includes(permission) || userPermissions.includes('*')
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

/**
 * Clear permission cache (call when permissions are updated)
 */
export const clearPermissionCache = () => {
  permissionCache.clear();
};

export default {
  requirePermission,
  requireAnyPermission,
  applySiteIsolation,
  clearPermissionCache
};
