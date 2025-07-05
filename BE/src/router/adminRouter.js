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
import { getUser } from '../middlewares/getUser.js';
import { 
  detectSiteMiddleware,
  requireSuperAdmin,
  requireSiteAdmin 
} from '../middlewares/siteDetection.js';
import { uploadLogo, uploadLogoToBase64, handleUploadErrors } from '../middlewares/upload.js';
import { requirePermission, requireAnyPermission, applySiteIsolation } from '../middlewares/permissionMiddleware.js';

const router = express.Router();

// Apply site detection first (doesn't require auth)
router.use(detectSiteMiddleware);

// Then require authentication for all admin routes
// Add extensive logging for Authorization header debugging
router.use((req, res, next) => {
  console.log('DEBUG Authorization header:', {
    authorization: req.headers.authorization,
    'content-type': req.headers['content-type'],
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl
  });
  next();
});

router.use(getUser); // ENABLED: Now debugging headers

// Override site detection for authenticated users based on their site_id
router.use(async (req, res, next) => {
  if (req.user && req.user.site_id && req.user.role === 'site_admin') {
    try {
      const Site = (await import('../model/Site.js')).default;
      const userSite = await Site.findById(req.user.site_id);
      
      if (userSite) {
        // Override the detected site with user's actual site
        req.site = userSite;
        req.siteId = userSite._id;
        req.siteFilter = { site_id: userSite._id };
      }
    } catch (error) {
      console.error('Error overriding site detection:', error);
    }
  }
  next();
});

// Debug route for checking permissions
router.get('/debug/permissions', (req, res) => {
  res.json({
    user: {
      id: req.user?._id,
      role: req.user?.role,
      email: req.user?.email
    },
    site: {
      id: req.site?._id,
      name: req.site?.name,
      domains: req.site?.domains
    },
    permissions: {
      isSuperAdmin: req.user?.role === 'super_admin',
      isSiteAdmin: req.site?.isSiteAdmin ? req.site.isSiteAdmin(req.user?._id) : false,
      siteAdminData: req.site?.site_admins?.find(admin => 
        admin.user_id.toString() === req.user?._id.toString()
      )
    }
  });
});

// Test upload endpoint for debugging
router.post('/debug/upload', uploadLogo, handleUploadErrors, (req, res) => {
  res.json({
    success: true,
    message: 'Upload test completed',
    file: req.file,
    body: req.body
  });
});

// Custom middleware to allow both super admin and site admin
const allowAdminAccess = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED'
    });
  }
  
  // Allow super admin - they can access any site's admin panel
  if (req.user.role === 'super_admin') {
    req.isSuperAdmin = true;
    req.canManageAllSites = true;
    return next();
  }
  
  // Allow site_admin - but they're restricted to their own site
  if (req.user.role === 'site_admin') {
    // Verify they're accessing via their site's domain
    if (!req.site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found for this domain',
        error: 'SITE_NOT_FOUND'
      });
    }
    
    // Check if admin belongs to this site
    if (req.user.site_id && req.user.site_id.toString() === req.site._id.toString()) {
      req.isSiteAdmin = true;
      req.canManageAllSites = false; // Can only manage their own site
      
      // Get their permissions from site's admin list
      if (req.site.isSiteAdmin && req.site.isSiteAdmin(req.user._id)) {
        const siteAdmin = req.site.site_admins.find(admin => 
          admin.user_id.toString() === req.user._id.toString()
        );
        if (siteAdmin) {
          req.siteAdminPermissions = siteAdmin.permissions;
          }
      }
      
      return next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'You can only access the admin panel of your own site',
        error: 'SITE_ACCESS_DENIED'
      });
    }
  }
  
  // Regular users (members) cannot access admin panel
  return res.status(403).json({
    success: false,
    message: 'Admin access required',
    error: 'ADMIN_ACCESS_REQUIRED'
  });
};

router.use(allowAdminAccess);

// Apply site isolation for all admin routes
router.use(applySiteIsolation);

// Admin site management routes with permissions
router.get('/sites', requirePermission('site.read'), getAllSites);
router.post('/sites', requirePermission('site.create'), uploadLogoToBase64, handleUploadErrors, createSite);
router.get('/sites/:id', requirePermission('site.read'), getSiteById);
router.get('/sites/:id/stats', requirePermission('analytics.read'), getSiteStats);
router.put('/sites/:id', requirePermission('site.update'), uploadLogo, handleUploadErrors, updateSite);
// Special route for admin form with multipart/form-data - using base64 method
router.put('/sites/edit/:id', requirePermission('site.update'), uploadLogoToBase64, handleUploadErrors, updateSite);
router.post('/sites/edit/:id', requirePermission('site.update'), uploadLogoToBase64, handleUploadErrors, updateSite);
router.delete('/sites/:id', requirePermission('site.delete'), deleteSite);

// Domain management
router.post('/sites/:id/domains', requirePermission('site.update'), addDomainToSite);
router.delete('/sites/:id/domains', requirePermission('site.update'), removeDomainFromSite);

export default router;
