const SiteAdmin = require('../model/SiteAdmin');
const User = require('../model/User');
const Site = require('../model/Site');
const { sendResponse, sendError } = require('../utils/responseHelper');

const SiteAdminController = {
  // Super admin: List all site admins across all sites
  async getAllSiteAdmins(req, res) {
    try {
      const { page = 1, limit = 10, site_id, status, role } = req.query;
      
      // Only super admin can access all site admins
      if (req.user.role !== 'super_admin') {
        return sendError(res, 'Access denied', 403);
      }

      const query = {};
      if (site_id) query.site_id = site_id;
      if (status) query.status = status;
      if (role) query.role = role;

      const siteAdmins = await SiteAdmin.find(query)
        .populate('user_id', 'name email')
        .populate('site_id', 'name slug')
        .populate('assigned_by', 'name email')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await SiteAdmin.countDocuments(query);

      sendResponse(res, {
        siteAdmins,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      sendError(res, error.message, 500);
    }
  },

  // Get site admins for a specific site
  async getSiteAdminsBySite(req, res) {
    try {
      const { siteId } = req.params;
      const { page = 1, limit = 10, status, role } = req.query;

      // Check permissions
      if (req.user.role !== 'super_admin' && req.currentSite?._id.toString() !== siteId) {
        return sendError(res, 'Access denied', 403);
      }

      const query = { site_id: siteId };
      if (status) query.status = status;
      if (role) query.role = role;

      const siteAdmins = await SiteAdmin.find(query)
        .populate('user_id', 'name email phone')
        .populate('assigned_by', 'name email')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await SiteAdmin.countDocuments(query);

      sendResponse(res, {
        siteAdmins,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      sendError(res, error.message, 500);
    }
  },

  // Assign user as site admin
  async assignSiteAdmin(req, res) {
    try {
      const { user_id, site_id, role = 'site_admin', permissions } = req.body;

      // Validate required fields
      if (!user_id || !site_id) {
        return sendError(res, 'User ID and Site ID are required', 400);
      }

      // Check if user is super admin or site admin of the target site
      if (req.user.role !== 'super_admin') {
        const isCurrentSiteAdmin = await SiteAdmin.findOne({
          user_id: req.user._id,
          site_id: site_id,
          status: 'active'
        });
        
        if (!isCurrentSiteAdmin) {
          return sendError(res, 'Access denied', 403);
        }
      }

      // Check if user exists
      const user = await User.findById(user_id);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      // Check if site exists
      const site = await Site.findById(site_id);
      if (!site) {
        return sendError(res, 'Site not found', 404);
      }

      // Check if user is already a site admin for this site
      const existingSiteAdmin = await SiteAdmin.findOne({
        user_id,
        site_id
      });

      if (existingSiteAdmin) {
        return sendError(res, 'User is already assigned to this site', 400);
      }

      // Create site admin assignment
      const siteAdmin = new SiteAdmin({
        user_id,
        site_id,
        role,
        permissions: permissions || ['read', 'write', 'manage_users', 'manage_content'],
        assigned_by: req.user._id
      });

      await siteAdmin.save();
      
      // Populate the response
      await siteAdmin.populate([
        { path: 'user_id', select: 'name email' },
        { path: 'site_id', select: 'name slug' },
        { path: 'assigned_by', select: 'name email' }
      ]);

      sendResponse(res, { siteAdmin }, 'Site admin assigned successfully', 201);
    } catch (error) {
      sendError(res, error.message, 500);
    }
  },

  // Update site admin role or permissions
  async updateSiteAdmin(req, res) {
    try {
      const { id } = req.params;
      const { role, permissions, status } = req.body;

      const siteAdmin = await SiteAdmin.findById(id);
      if (!siteAdmin) {
        return sendError(res, 'Site admin not found', 404);
      }

      // Check permissions
      if (req.user.role !== 'super_admin') {
        const isCurrentSiteAdmin = await SiteAdmin.findOne({
          user_id: req.user._id,
          site_id: siteAdmin.site_id,
          status: 'active'
        });
        
        if (!isCurrentSiteAdmin) {
          return sendError(res, 'Access denied', 403);
        }
      }

      // Update fields
      if (role) siteAdmin.role = role;
      if (permissions) siteAdmin.permissions = permissions;
      if (status) siteAdmin.status = status;

      await siteAdmin.save();
      
      // Populate the response
      await siteAdmin.populate([
        { path: 'user_id', select: 'name email' },
        { path: 'site_id', select: 'name slug' },
        { path: 'assigned_by', select: 'name email' }
      ]);

      sendResponse(res, { siteAdmin }, 'Site admin updated successfully');
    } catch (error) {
      sendError(res, error.message, 500);
    }
  },

  // Remove site admin
  async removeSiteAdmin(req, res) {
    try {
      const { id } = req.params;

      const siteAdmin = await SiteAdmin.findById(id);
      if (!siteAdmin) {
        return sendError(res, 'Site admin not found', 404);
      }

      // Check permissions
      if (req.user.role !== 'super_admin') {
        const isCurrentSiteAdmin = await SiteAdmin.findOne({
          user_id: req.user._id,
          site_id: siteAdmin.site_id,
          status: 'active'
        });
        
        if (!isCurrentSiteAdmin) {
          return sendError(res, 'Access denied', 403);
        }
      }

      await SiteAdmin.findByIdAndDelete(id);

      sendResponse(res, null, 'Site admin removed successfully');
    } catch (error) {
      sendError(res, error.message, 500);
    }
  },

  // Get current user's site admin roles
  async getMyAdminRoles(req, res) {
    try {
      const siteAdminRoles = await SiteAdmin.find({
        user_id: req.user._id,
        status: 'active'
      })
        .populate('site_id', 'name slug domains')
        .sort({ createdAt: -1 });

      sendResponse(res, { adminRoles: siteAdminRoles });
    } catch (error) {
      sendError(res, error.message, 500);
    }
  }
};

module.exports = SiteAdminController;
