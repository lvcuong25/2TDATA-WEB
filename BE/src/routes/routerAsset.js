const express = require('express');
const router = express.Router();
const AssetController = require('../controllers/AssetController');
const { body } = require('express-validator');

// Validation middleware
const validateThemeConfig = [
  body('theme_config').optional().isObject().withMessage('Theme config must be an object'),
  body('theme_config.colors').optional().isObject().withMessage('Colors must be an object'),
  body('theme_config.layout').optional().isString().withMessage('Layout must be a string'),
  body('theme_config.custom_css').optional().isString().withMessage('Custom CSS must be a string')
];

// Asset management routes (protected - require authentication)

// Upload logo for current site
router.post('/logo', AssetController.uploadLogo);

// Upload logo for specific site (super admin only)
router.post('/:site_id/logo', AssetController.uploadLogo);

// Upload asset for current site
router.post('/upload', AssetController.uploadAsset);

// Upload asset for specific site (super admin only)
router.post('/:site_id/upload', AssetController.uploadAsset);

// Get assets for current site
router.get('/', AssetController.getAssets);

// Get assets for specific site
router.get('/:site_id', AssetController.getAssets);

// Update theme configuration for current site
router.put('/theme', validateThemeConfig, AssetController.updateThemeConfig);

// Update theme configuration for specific site (super admin only)
router.put('/:site_id/theme', validateThemeConfig, AssetController.updateThemeConfig);

// Delete asset from current site
router.delete('/:asset_type/:filename', AssetController.deleteAsset);

// Delete asset from specific site (super admin only)
router.delete('/:site_id/:asset_type/:filename', AssetController.deleteAsset);

// Public asset serving routes (no authentication required)

// Serve assets by site ID and filename
router.get('/serve/:site_id/:filename', AssetController.serveAsset);

module.exports = router;
