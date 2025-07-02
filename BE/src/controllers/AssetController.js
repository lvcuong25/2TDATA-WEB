const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Site = require('../models/Site');
const { validationResult } = require('express-validator');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const siteId = req.siteId || req.body.site_id;
      if (!siteId) {
        return cb(new Error('Site ID is required'), null);
      }
      
      const uploadPath = path.join(__dirname, '../../uploads/sites', siteId);
      
      // Create directory if it doesn't exist
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${timestamp}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, CSS, JS, and common web assets
  const allowedTypes = /jpeg|jpg|png|gif|svg|css|js|ico|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files, CSS, JS, and web assets are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

class AssetController {
  // Upload logo for a site
  static uploadLogo = [
    upload.single('logo'),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const siteId = req.siteId || req.body.site_id;
        const site = await Site.findById(siteId);
        
        if (!site) {
          return res.status(404).json({ error: 'Site not found' });
        }

        // Check permissions
        if (req.userRole !== 'super_admin' && !req.isSiteAdmin) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Delete old logo if exists
        if (site.logo_url) {
          const oldLogoPath = path.join(__dirname, '../../uploads', site.logo_url.replace('/uploads/', ''));
          try {
            await fs.unlink(oldLogoPath);
          } catch (error) {
            console.log('Old logo file not found or already deleted');
          }
        }

        // Update site with new logo URL
        const logoUrl = `/uploads/sites/${siteId}/${req.file.filename}`;
        site.logo_url = logoUrl;
        await site.save();

        res.json({
          message: 'Logo uploaded successfully',
          logo_url: logoUrl,
          file_info: {
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype
          }
        });
      } catch (error) {
        console.error('Upload logo error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  ];

  // Upload custom assets (CSS, JS, images)
  static uploadAsset = [
    upload.single('asset'),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const siteId = req.siteId || req.body.site_id;
        const assetType = req.body.asset_type || 'general'; // 'css', 'js', 'image', 'general'
        
        const site = await Site.findById(siteId);
        if (!site) {
          return res.status(404).json({ error: 'Site not found' });
        }

        // Check permissions
        if (req.userRole !== 'super_admin' && !req.isSiteAdmin) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const assetUrl = `/uploads/sites/${siteId}/${req.file.filename}`;

        // Add asset reference to site's theme_config
        if (!site.theme_config.assets) {
          site.theme_config.assets = {};
        }
        
        if (!site.theme_config.assets[assetType]) {
          site.theme_config.assets[assetType] = [];
        }

        site.theme_config.assets[assetType].push({
          filename: req.file.filename,
          url: assetUrl,
          original_name: req.file.originalname,
          size: req.file.size,
          uploaded_at: new Date()
        });

        await site.save();

        res.json({
          message: 'Asset uploaded successfully',
          asset_url: assetUrl,
          asset_type: assetType,
          file_info: {
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype
          }
        });
      } catch (error) {
        console.error('Upload asset error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  ];

  // Get site assets
  static getAssets = async (req, res) => {
    try {
      const siteId = req.siteId || req.params.site_id;
      
      const site = await Site.findById(siteId);
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }

      res.json({
        site_id: siteId,
        logo_url: site.logo_url,
        assets: site.theme_config.assets || {},
        theme_config: site.theme_config
      });
    } catch (error) {
      console.error('Get assets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Delete asset
  static deleteAsset = async (req, res) => {
    try {
      const { filename, asset_type } = req.params;
      const siteId = req.siteId || req.params.site_id;

      const site = await Site.findById(siteId);
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }

      // Check permissions
      if (req.userRole !== 'super_admin' && !req.isSiteAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Remove from file system
      const filePath = path.join(__dirname, '../../uploads/sites', siteId, filename);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.log('File not found or already deleted');
      }

      // Remove from site's theme_config
      if (site.theme_config.assets && site.theme_config.assets[asset_type]) {
        site.theme_config.assets[asset_type] = site.theme_config.assets[asset_type]
          .filter(asset => asset.filename !== filename);
      }

      await site.save();

      res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
      console.error('Delete asset error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Update theme configuration
  static updateThemeConfig = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const siteId = req.siteId || req.params.site_id;
      const { theme_config } = req.body;

      const site = await Site.findById(siteId);
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }

      // Check permissions
      if (req.userRole !== 'super_admin' && !req.isSiteAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Merge new theme config with existing config (preserve assets)
      site.theme_config = {
        ...site.theme_config,
        ...theme_config,
        assets: site.theme_config.assets || {} // Preserve existing assets
      };

      await site.save();

      res.json({
        message: 'Theme configuration updated successfully',
        theme_config: site.theme_config
      });
    } catch (error) {
      console.error('Update theme config error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Serve assets (public endpoint)
  static serveAsset = async (req, res) => {
    try {
      const { site_id, filename } = req.params;
      
      const filePath = path.join(__dirname, '../../uploads/sites', site_id, filename);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      // Set appropriate headers based on file type
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.ico': 'image/x-icon',
        '.webp': 'image/webp'
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

      res.sendFile(filePath);
    } catch (error) {
      console.error('Serve asset error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

module.exports = AssetController;
