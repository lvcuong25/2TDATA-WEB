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

const router = express.Router();

// Public routes - Get current site info (no auth required)
// Explicitly add detectSiteMiddleware for this route
router.get('/current', detectSiteMiddleware, getCurrentSiteInfo);

// Protected routes - require authentication
router.use(getUser);

// Super Admin only routes
router.get('/', requireSuperAdmin, getAllSites);
router.post('/', requireSuperAdmin, uploadLogoToBase64, handleUploadErrors, createSite);
router.get('/:id', requireSuperAdmin, getSiteById);
router.get('/:id/stats', requireSuperAdmin, getSiteStats);
router.put('/:id', requireSuperAdmin, uploadLogo, handleUploadErrors, updateSite);
router.delete('/:id', requireSuperAdmin, deleteSite);

// Domain management - Super Admin only
router.post('/:id/domains', requireSuperAdmin, addDomainToSite);
router.delete('/:id/domains', requireSuperAdmin, removeDomainFromSite);

export default router;
