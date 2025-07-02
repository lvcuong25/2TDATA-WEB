import Site from '../model/Site.js';
import User from '../model/User.js';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

/**
 * Super Admin - Lấy danh sách tất cả sites
 */
export const getAllSites = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    
    // Build query filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { domains: { $elemMatch: { $regex: search, $options: 'i' } } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    const options = {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'site_admins.user_id',
          select: 'name email'
        }
      ]
    };
    
    const result = await Site.paginate(filter, options);
    
    res.status(200).json({
      success: true,
      data: result.docs,
      pagination: {
        totalDocs: result.totalDocs,
        limit: result.limit,
        page: result.page,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
        nextPage: result.nextPage,
        prevPage: result.prevPage
      }
    });
  } catch (error) {
    console.error('Get all sites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sites',
      error: error.message
    });
  }
};

/**
 * Super Admin - Tạo site mới (affiliate)
 */
export const createSite = async (req, res) => {
  try {
    const {
      name,
      domains,
      theme_config,
      logo_url,
      settings,
      site_admins
    } = req.body;
    
    // Validate required fields
    if (!name || !domains || !Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name and at least one domain are required'
      });
    }
    
    // Check if domains already exist
    const existingDomains = await Site.find({
      domains: { $in: domains }
    });
    
    if (existingDomains.length > 0) {
      const conflictDomains = existingDomains.flatMap(site => 
        site.domains.filter(domain => domains.includes(domain))
      );
      
      return res.status(400).json({
        success: false,
        message: `Domains already exist: ${conflictDomains.join(', ')}`
      });
    }
    
    // Validate site admins if provided
    if (site_admins && site_admins.length > 0) {
      const adminUserIds = site_admins.map(admin => admin.user_id);
      const existingUsers = await User.find({
        _id: { $in: adminUserIds }
      });
      
      if (existingUsers.length !== adminUserIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some site admin users do not exist'
        });
      }
    }
    
    // Create new site
    const newSite = new Site({
      name,
      domains: domains.map(domain => domain.toLowerCase()),
      theme_config: theme_config || {},
      logo_url,
      settings: settings || {},
      site_admins: site_admins || []
    });
    
    await newSite.save();
    
    // Populate site admins for response
    await newSite.populate('site_admins.user_id', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Site created successfully',
      data: newSite
    });
  } catch (error) {
    console.error('Create site error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create site',
      error: error.message
    });
  }
};

/**
 * Super Admin - Lấy thông tin chi tiết của site
 */
export const getSiteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid site ID'
      });
    }
    
    const site = await Site.findById(id)
      .populate('site_admins.user_id', 'name email role');
    
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }
    
    // Get site statistics
    const stats = await Promise.all([
      User.countDocuments({ site_id: id }),
      // Add more counts as needed for other models
    ]);
    
    site.stats.totalUsers = stats[0];
    await site.save();
    
    res.status(200).json({
      success: true,
      data: site
    });
  } catch (error) {
    console.error('Get site by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get site',
      error: error.message
    });
  }
};

/**
 * Super Admin - Lấy thống kê của site
 */
export const getSiteStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid site ID'
      });
    }
    
    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }
    
    // Get detailed statistics
    const stats = {
      totalUsers: await User.countDocuments({ site_id: id }),
      activeUsers: await User.countDocuments({ site_id: id, active: true }),
      totalDomains: site.domains?.length || 0,
      totalAdmins: site.site_admins?.length || 0,
      createdAt: site.createdAt,
      lastActivity: site.stats?.lastActivity || site.updatedAt,
      status: site.status
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get site stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get site statistics',
      error: error.message
    });
  }
};

/**
 * Super Admin - Cập nhật site
 */
export const updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid site ID'
      });
    }
    
    // Check if site exists
    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }
    
    // Handle FormData fields (when file is uploaded, other fields come as strings)
    if (req.body.domains && typeof req.body.domains === 'string') {
      try {
        updateData.domains = JSON.parse(req.body.domains);
      } catch (e) {
        // If parsing fails, treat as single domain
        updateData.domains = [req.body.domains];
      }
    }
    
    if (req.body.theme_config && typeof req.body.theme_config === 'string') {
      try {
        const parsedThemeConfig = JSON.parse(req.body.theme_config);
        // Map frontend field names to backend field names
        // Handle Antd ColorPicker format
        const getPrimaryColor = () => {
          const primary = parsedThemeConfig.primary_color || parsedThemeConfig.primaryColor;
          if (typeof primary === 'string') return primary;
          if (primary?.metaColor) {
            const { r, g, b } = primary.metaColor;
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          }
          return '#3B82F6';
        };
        
        const getSecondaryColor = () => {
          const secondary = parsedThemeConfig.secondary_color || parsedThemeConfig.secondaryColor;
          if (typeof secondary === 'string') return secondary;
          if (secondary?.metaColor) {
            const { r, g, b } = secondary.metaColor;
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          }
          return '#1F2937';
        };
        
        updateData.theme_config = {
          primaryColor: getPrimaryColor(),
          secondaryColor: getSecondaryColor(),
          layout: parsedThemeConfig.layout || 'default',
          logoUrl: parsedThemeConfig.logoUrl,
          faviconUrl: parsedThemeConfig.faviconUrl,
          customCss: parsedThemeConfig.custom_css || parsedThemeConfig.customCss
        };
        console.log('✅ Processed theme_config:', updateData.theme_config);
      } catch (e) {
        console.error('Error parsing theme_config:', e);
      }
    } else if (req.body.theme_config && typeof req.body.theme_config === 'object') {
      // Handle direct object (non-FormData requests)
      const directThemeConfig = req.body.theme_config;
      
      const getDirectPrimaryColor = () => {
        const primary = directThemeConfig.primary_color || directThemeConfig.primaryColor;
        if (typeof primary === 'string') return primary;
        if (primary?.metaColor) {
          const { r, g, b } = primary.metaColor;
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        return '#3B82F6';
      };
      
      const getDirectSecondaryColor = () => {
        const secondary = directThemeConfig.secondary_color || directThemeConfig.secondaryColor;
        if (typeof secondary === 'string') return secondary;
        if (secondary?.metaColor) {
          const { r, g, b } = secondary.metaColor;
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        return '#1F2937';
      };
      
      updateData.theme_config = {
        primaryColor: getDirectPrimaryColor(),
        secondaryColor: getDirectSecondaryColor(),
        layout: directThemeConfig.layout || 'default',
        logoUrl: directThemeConfig.logoUrl,
        faviconUrl: directThemeConfig.faviconUrl,
        customCss: directThemeConfig.custom_css || directThemeConfig.customCss
      };
      console.log('✅ Direct theme_config:', updateData.theme_config);
    }
    
    if (req.body.settings && typeof req.body.settings === 'string') {
      try {
        updateData.settings = JSON.parse(req.body.settings);
      } catch (e) {
        console.error('Error parsing settings:', e);
      }
    }
    
    // Handle logo upload if file was uploaded
    if (req.file) {
      if (req.file.buffer) {
        // BASE64 METHOD: Convert buffer to base64 and store in database
        const base64Data = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        updateData.logo_url = `data:${mimeType};base64,${base64Data}`;
        
        console.log('✅ Logo converted to base64');
        console.log('📸 Logo size:', req.file.size, 'bytes');
        console.log('🎨 MIME Type:', mimeType);
        console.log('📦 Base64 length:', base64Data.length);
      } else {
        // FALLBACK: File system method
        updateData.logo_url = `/logos/${req.file.filename}`;
        
        console.log('✅ Logo uploaded to file system:', req.file.filename);
        console.log('📸 Logo URL:', updateData.logo_url);
        console.log('📁 Logo saved to backend uploads directory:', req.file.path);
      }
      
      // Clean up old logo file if exists in uploads directory
      if (site.logo_url && site.logo_url.includes('/api/uploads/logos/')) {
        const oldFileName = site.logo_url.split('/api/uploads/logos/').pop();
        const fullOldPath = path.join(process.cwd(), 'uploads', 'logos', oldFileName);
        if (fs.existsSync(fullOldPath)) {
          try {
            fs.unlinkSync(fullOldPath);
            console.log('🗑️ Old logo deleted:', fullOldPath);
          } catch (error) {
            console.error('❌ Error deleting old logo:', error);
          }
        }
      }
    }
    
    // Check domains conflict if domains are being updated
    if (updateData.domains && Array.isArray(updateData.domains) && updateData.domains.length > 0) {
      const existingDomains = await Site.find({
        _id: { $ne: id },
        domains: { $in: updateData.domains }
      });
      
      if (existingDomains.length > 0) {
        const conflictDomains = existingDomains.flatMap(site => 
          site.domains.filter(domain => updateData.domains.includes(domain))
        );
        
        return res.status(400).json({
          success: false,
          message: `Domains already exist: ${conflictDomains.join(', ')}`
        });
      }
      
      updateData.domains = updateData.domains.map(domain => domain.toLowerCase());
    }
    
    // Validate site admins if being updated
    if (updateData.site_admins) {
      const adminUserIds = updateData.site_admins.map(admin => admin.user_id);
      const existingUsers = await User.find({
        _id: { $in: adminUserIds }
      });
      
      if (existingUsers.length !== adminUserIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some site admin users do not exist'
        });
      }
    }
    
    const updatedSite = await Site.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('site_admins.user_id', 'name email');
    
    res.status(200).json({
      success: true,
      message: 'Site updated successfully',
      data: updatedSite
    });
  } catch (error) {
    console.error('Update site error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update site',
      error: error.message
    });
  }
};

/**
 * Super Admin - Xóa site
 */
export const deleteSite = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid site ID'
      });
    }
    
    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }
    
    // Check if site has users (prevent deletion if has users)
    const userCount = await User.countDocuments({ site_id: id });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete site with ${userCount} users. Please migrate users first.`
      });
    }
    
    await Site.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Site deleted successfully'
    });
  } catch (error) {
    console.error('Delete site error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete site',
      error: error.message
    });
  }
};

/**
 * Super Admin - Thêm domain mới cho site
 */
export const addDomainToSite = async (req, res) => {
  try {
    const { id } = req.params;
    const { domain } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid site ID'
      });
    }
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required'
      });
    }
    
    const normalizedDomain = domain.toLowerCase();
    
    // Check if domain already exists
    const existingSite = await Site.findOne({
      domains: normalizedDomain
    });
    
    if (existingSite) {
      return res.status(400).json({
        success: false,
        message: 'Domain already exists'
      });
    }
    
    const site = await Site.findByIdAndUpdate(
      id,
      { $addToSet: { domains: normalizedDomain } },
      { new: true }
    );
    
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Domain added successfully',
      data: site
    });
  } catch (error) {
    console.error('Add domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add domain',
      error: error.message
    });
  }
};

/**
 * Super Admin - Xóa domain khỏi site
 */
export const removeDomainFromSite = async (req, res) => {
  try {
    const { id } = req.params;
    const { domain } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid site ID'
      });
    }
    
    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }
    
    if (site.domains.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the last domain from site'
      });
    }
    
    const updatedSite = await Site.findByIdAndUpdate(
      id,
      { $pull: { domains: domain.toLowerCase() } },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Domain removed successfully',
      data: updatedSite
    });
  } catch (error) {
    console.error('Remove domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove domain',
      error: error.message
    });
  }
};

/**
 * Get current site info (for any authenticated user)
 */
export const getCurrentSiteInfo = async (req, res) => {
  try {
    console.log('🌐 getCurrentSiteInfo called with:', {
      site: req.site ? req.site.name : 'No site',
      siteId: req.site ? req.site._id : 'No site ID',
      siteDomains: req.site ? req.site.domains : 'No domains',
      headers: {
        'x-host': req.get('x-host'),
        'host': req.get('host'),
        'hostname': req.hostname
      },
      url: req.url,
      path: req.path
    });
    
    if (!req.site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }
    
    // Return public site information
    const siteInfo = {
      _id: req.site._id,
      name: req.site.name,
      domains: req.site.domains,
      theme_config: req.site.theme_config,
      logo_url: req.site.logo_url,
      settings: req.site.settings,
      stats: req.site.stats
    };
    
    res.status(200).json({
      success: true,
      data: siteInfo
    });
  } catch (error) {
    console.error('Get current site info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get site info',
      error: error.message
    });
  }
};
