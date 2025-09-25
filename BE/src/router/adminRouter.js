import express from 'express';
import {
  getAllSites,
  createSite,
  getSiteById,
  getSiteStats,
  updateSite,
  deleteSite,
  addDomainToSite,
  removeDomainFromSite,
  getCurrentSiteInfo
} from '../controllers/site.js';
import { authAndSiteDetectionMiddleware } from '../middlewares/authAndSiteDetection.js';
import { uploadLogo, uploadLogoToBase64, handleUploadErrors } from '../middlewares/upload.js';
import { requirePermission, requireAnyPermission, applySiteIsolation } from '../middlewares/permissionMiddleware.js';
import { getUserFormMetadata, getAllRoles } from '../controllers/metadata.js';

const router = express.Router();

// Use combined auth and site detection middleware
router.use(authAndSiteDetectionMiddleware);

// Custom middleware to verify admin access
const verifyAdminAccess = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED'
    });
  }
  
  // Debug log để kiểm tra user object
  // console.log('🔍 Admin access check - User object:', {
  //   id: req.user._id,
  //   email: req.user.email,
  //   role: req.user.role,
  //   roleType: typeof req.user.role,
  //   hasRole: 'role' in req.user,
  //   allKeys: Object.keys(req.user)
  // });
  
  // Super admin has access to everything
  if (req.user.role === 'super_admin') {
    // console.log('✅ Super admin access granted');
    req.isAdmin = true;
    req.canManageAllSites = true;
    return next();
  }
  
  // Site admin check - just check role and site_id
  if (req.user.role === 'site_admin') {
    // Site admin must have a site assigned
    if (!req.user.site_id) {
      return res.status(403).json({
        success: false,
        message: 'Site admin does not have a site assigned',
        error: 'NO_SITE_ASSIGNED'
      });
    }
    
    // Check if accessing their own site
    // Compare site_id from user with detected site
    const userSiteId = req.user.site_id._id || req.user.site_id;
    const currentSiteId = req.site?._id;
    
    // Allow access if:
    // 1. Site IDs match OR
    // 2. No site detected (accessing via IP/different domain) but user has site_admin role
    if (!currentSiteId || userSiteId.toString() === currentSiteId.toString()) {
      req.isAdmin = true;
      req.canManageAllSites = false;
      req.isSiteAdmin = true;
      return next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'You can only access the admin panel of your assigned site',
        error: 'SITE_ACCESS_DENIED'
      });
    }
  }
  
  // Other roles don't have admin access
  return res.status(403).json({
    success: false,
    message: 'Admin access required',
    error: 'ADMIN_ACCESS_REQUIRED'
  });
};

// Apply admin access check
router.use(verifyAdminAccess);

// Apply site isolation
router.use(applySiteIsolation);

// Debug routes
router.get('/debug/permissions', (req, res) => {
  res.json({
    user: {
      id: req.user?._id,
      role: req.user?.role,
      email: req.user?.email,
      site_id: req.user?.site_id?._id || req.user?.site_id
    },
    site: {
      id: req.site?._id,
      name: req.site?.name,
      domains: req.site?.domains
    },
    permissions: {
      isAdmin: req.isAdmin,
      isSiteAdmin: req.isSiteAdmin,
      canManageAllSites: req.canManageAllSites,
      siteFilter: req.siteFilter
    }
  });
});

// Test endpoint để kiểm tra admin access
router.get('/test', (req, res) => {
  res.json({
    message: 'Admin access test successful',
    user: req.user ? {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    } : null,
    isAdmin: req.isAdmin,
    canManageAllSites: req.canManageAllSites
  });
});

// Metadata endpoints - available to all admins
router.get('/metadata/user-form', getUserFormMetadata);
router.get('/metadata/roles', getAllRoles);

// Site management routes
router.get('/sites', requirePermission('site.read'), getAllSites);
router.post('/sites', requirePermission('site.create'), uploadLogoToBase64, handleUploadErrors, createSite);
router.post('/sites/add', requirePermission('site.create'), uploadLogoToBase64, handleUploadErrors, createSite);
router.get('/sites/:id', requirePermission('site.read'), getSiteById);
router.get('/sites/:id/stats', requirePermission('analytics.read'), getSiteStats);
router.put('/sites/:id', requirePermission('site.update'), uploadLogo, handleUploadErrors, updateSite);
router.put('/sites/edit/:id', requirePermission('site.update'), uploadLogoToBase64, handleUploadErrors, updateSite);
router.post('/sites/edit/:id', requirePermission('site.update'), uploadLogoToBase64, handleUploadErrors, updateSite);
router.delete('/sites/:id', requirePermission('site.delete'), deleteSite);

// Domain management
router.post('/sites/:id/domains', requirePermission('site.update'), addDomainToSite);
router.delete('/sites/:id/domains', requirePermission('site.update'), removeDomainFromSite);

export default router;
