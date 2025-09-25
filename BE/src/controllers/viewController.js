import View from '../model/View.js';
import Table from '../model/Table.js';
import BaseMember from '../model/BaseMember.js';
import { validationResult } from 'express-validator';

// Create a new view
export const createView = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { tableId, name, type, description, config, isDefault, isPublic } = req.body;
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "UNAUTHORIZED"
      });
    }

    const userId = req.user._id;
    const siteId = req.user.site_id?._id || req.site?._id;

    // Verify table exists and get its database info
    const table = await Table.findById(tableId).populate('databaseId');
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Check if user is a member of the database
    const baseMember = await BaseMember.findOne({
      databaseId: table.databaseId._id,
      userId
    });

    if (!baseMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you are not a member of this database'
      });
    }

    // Check if user has permission to add views
    console.log('ViewController - createView - checking permissions:', {
      userId,
      userRole: baseMember.role,
      tableId,
      baseMember: baseMember
    });

    if (baseMember.role === 'member') {
      // For members, check table permissions
      const TablePermission = (await import('../model/TablePermission.js')).default;
      
      const tablePermissions = await TablePermission.find({
        tableId: tableId,
        $or: [
          { targetType: 'all_members' },
          { targetType: 'specific_user', userId: userId },
          { targetType: 'specific_role', role: baseMember.role }
        ]
      });

      console.log('ViewController - createView - found permissions:', tablePermissions);

      let canAddView = false;
      
      // Sort permissions by priority: specific_user > specific_role > all_members
      const sortedPermissions = tablePermissions.sort((a, b) => {
        const priority = { 'specific_user': 3, 'specific_role': 2, 'all_members': 1 };
        return (priority[b.targetType] || 0) - (priority[a.targetType] || 0);
      });
      
      console.log('ViewController - createView - sorted permissions:', sortedPermissions.map(p => ({
        id: p._id,
        targetType: p.targetType,
        userId: p.userId,
        role: p.role,
        canAddView: p.viewPermissions?.canAddView
      })));
      
      // Check permissions in priority order
      for (const perm of sortedPermissions) {
        console.log('ViewController - createView - checking permission:', {
          permissionId: perm._id,
          targetType: perm.targetType,
          viewPermissions: perm.viewPermissions
        });
        
        if (perm.viewPermissions && perm.viewPermissions.canAddView !== undefined) {
          canAddView = perm.viewPermissions.canAddView;
          console.log('ViewController - createView - permission found, stopping at:', {
            targetType: perm.targetType,
            canAddView: canAddView
          });
          break; // Stop at first permission found (highest priority)
        }
      }

      console.log('ViewController - createView - canAddView result:', canAddView);

      if (!canAddView) {
        console.log('ViewController - createView - access denied');
        return res.status(403).json({
          success: false,
          message: 'Access denied - you do not have permission to add views to this table'
        });
      }
    } else {
      console.log('ViewController - createView - user is owner/manager, bypassing permission check');
    }
    // Owners and managers can always add views

    // Check if view name already exists for this table and user
    const existingView = await View.findOne({
      tableId,
      userId,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingView) {
      return res.status(400).json({
        success: false,
        message: 'View name already exists for this table'
      });
    }

    // If this is set as default, unset other default views for this table
    if (isDefault) {
      await View.updateMany(
        { tableId, userId },
        { isDefault: false }
      );
    }

    // Create new view
    const view = new View({
      tableId,
      userId,
      siteId,
      name,
      type,
      description,
      config: config || {},
      isDefault: isDefault || false,
      isPublic: isPublic || false,
      order: 0
    });

    await view.save();

    // Populate the view with table information
    await view.populate('tableId', 'name description');

    res.status(201).json({
      success: true,
      message: 'View created successfully',
      data: view
    });

  } catch (error) {
    console.error('Error creating view:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all views for a table
export const getViews = async (req, res) => {
  try {
    const { tableId } = req.params;
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "UNAUTHORIZED"
      });
    }

    const userId = req.user._id;

    // Verify table exists and get its database info
    const table = await Table.findById(tableId).populate('databaseId');
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Check if user is a member of the database
    const baseMember = await BaseMember.findOne({
      databaseId: table.databaseId._id,
      userId
    });

    if (!baseMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you are not a member of this database'
      });
    }

    // Get all views for this table
    let views = await View.find({ tableId })
      .populate('tableId', 'name description')
      .sort({ order: 1, createdAt: -1 });

    // For members, filter views based on permissions
    if (baseMember.role === 'member') {
      const TablePermission = (await import('../model/TablePermission.js')).default;
      
      const tablePermissions = await TablePermission.find({
        tableId: tableId,
        $or: [
          { targetType: 'all_members' },
          { targetType: 'specific_user', userId: userId },
          { targetType: 'specific_role', role: baseMember.role }
        ]
      });

      let canView = false;
      tablePermissions.forEach(perm => {
        if (perm.viewPermissions && perm.viewPermissions.canView) {
          canView = true;
        }
      });

      if (!canView) {
        // If no view permission, only show user's own views
        views = views.filter(view => view.userId.toString() === userId.toString());
      }
    }
    // Owners and managers can see all views

    res.json({
      success: true,
      data: views
    });

  } catch (error) {
    console.error('Error getting views:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get view by ID
export const getViewById = async (req, res) => {
  try {
    const { viewId } = req.params;
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "UNAUTHORIZED"
      });
    }

    const userId = req.user._id;

    const view = await View.findOne({
      _id: viewId,
      $or: [
        { userId },
        { isPublic: true }
      ]
    }).populate('tableId', 'name description');

    if (!view) {
      return res.status(404).json({
        success: false,
        message: 'View not found'
      });
    }

    res.json({
      success: true,
      data: view
    });

  } catch (error) {
    console.error('Error getting view:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update view
export const updateView = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { viewId } = req.params;
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "UNAUTHORIZED"
      });
    }

    const userId = req.user._id;
    const { name, type, description, config, isDefault, isPublic } = req.body;

    // Find view and get table info
    const view = await View.findOne({
      _id: viewId
    }).populate('tableId');

    if (!view) {
      return res.status(404).json({
        success: false,
        message: 'View not found'
      });
    }

    // Check if user is a member of the database
    const baseMember = await BaseMember.findOne({
      databaseId: view.tableId.databaseId,
      userId
    });

    if (!baseMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you are not a member of this database'
      });
    }

    // Check if user has permission to edit views
    if (baseMember.role === 'member') {
      // For members, check table permissions
      const TablePermission = (await import('../model/TablePermission.js')).default;
      
      const tablePermissions = await TablePermission.find({
        tableId: view.tableId._id,
        $or: [
          { targetType: 'all_members' },
          { targetType: 'specific_user', userId: userId },
          { targetType: 'specific_role', role: baseMember.role }
        ]
      });

      let canEditView = false;
      tablePermissions.forEach(perm => {
        if (perm.viewPermissions && perm.viewPermissions.canEditView) {
          canEditView = true;
        }
      });

      if (!canEditView) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - you do not have permission to edit views in this table'
        });
      }
    }
    // Owners and managers can always edit views

    // Check if new name conflicts with existing views
    if (name && name !== view.name) {
      const existingView = await View.findOne({
        tableId: view.tableId,
        userId,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: viewId }
      });

      if (existingView) {
        return res.status(400).json({
          success: false,
          message: 'View name already exists for this table'
        });
      }
    }

    // If setting as default, unset other defaults
    if (isDefault && !view.isDefault) {
      await View.updateMany(
        { tableId: view.tableId, userId },
        { isDefault: false }
      );
    }

    // Update view
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (config !== undefined) updateData.config = config;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updatedView = await View.findByIdAndUpdate(
      viewId,
      updateData,
      { new: true, runValidators: true }
    ).populate('tableId', 'name description');

    res.json({
      success: true,
      message: 'View updated successfully',
      data: updatedView
    });

  } catch (error) {
    console.error('Error updating view:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete view
export const deleteView = async (req, res) => {
  try {
    const { viewId } = req.params;
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "UNAUTHORIZED"
      });
    }

    const userId = req.user._id;

    const view = await View.findOne({
      _id: viewId
    }).populate('tableId');

    if (!view) {
      return res.status(404).json({
        success: false,
        message: 'View not found'
      });
    }

    // Check if user is a member of the database
    const baseMember = await BaseMember.findOne({
      databaseId: view.tableId.databaseId,
      userId
    });

    if (!baseMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you are not a member of this database'
      });
    }

    // Check if user has permission to delete views
    console.log('ViewController - deleteView - checking permissions:', {
      userId,
      userRole: baseMember.role,
      tableId: view.tableId._id,
      baseMember: baseMember
    });

    if (baseMember.role === 'member') {
      // For members, check table permissions
      const TablePermission = (await import('../model/TablePermission.js')).default;
      
      const tablePermissions = await TablePermission.find({
        tableId: view.tableId._id,
        $or: [
          { targetType: 'all_members' },
          { targetType: 'specific_user', userId: userId },
          { targetType: 'specific_role', role: baseMember.role }
        ]
      });

      console.log('ViewController - deleteView - found permissions:', tablePermissions);

      let canEditView = false;
      
      // Sort permissions by priority: specific_user > specific_role > all_members
      const sortedPermissions = tablePermissions.sort((a, b) => {
        const priority = { 'specific_user': 3, 'specific_role': 2, 'all_members': 1 };
        return (priority[b.targetType] || 0) - (priority[a.targetType] || 0);
      });
      
      // Check permissions in priority order
      for (const perm of sortedPermissions) {
        console.log('ViewController - deleteView - checking permission:', {
          permissionId: perm._id,
          targetType: perm.targetType,
          viewPermissions: perm.viewPermissions
        });
        
        if (perm.viewPermissions && perm.viewPermissions.canEditView !== undefined) {
          canEditView = perm.viewPermissions.canEditView;
          console.log('ViewController - deleteView - permission found, stopping at:', {
            targetType: perm.targetType,
            canEditView: canEditView
          });
          break; // Stop at first permission found (highest priority)
        }
      }

      console.log('ViewController - deleteView - canEditView result:', canEditView);

      if (!canEditView) {
        console.log('ViewController - deleteView - access denied');
        return res.status(403).json({
          success: false,
          message: 'Access denied - you do not have permission to delete views in this table'
        });
      }
    } else {
      console.log('ViewController - deleteView - user is owner/manager, bypassing permission check');
    }
    // Owners and managers can always delete views

    await View.findByIdAndDelete(viewId);

    res.json({
      success: true,
      message: 'View deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting view:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Copy view
export const copyView = async (req, res) => {
  try {
    const { viewId } = req.params;
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "UNAUTHORIZED"
      });
    }

    const userId = req.user._id;
    const { name, targetTableId } = req.body;

    // Find original view
    const originalView = await View.findOne({
      _id: viewId,
      $or: [
        { userId },
        { isPublic: true }
      ]
    });

    if (!originalView) {
      return res.status(404).json({
        success: false,
        message: 'View not found or access denied'
      });
    }

    // Verify target table exists
    const targetTable = await Table.findById(targetTableId);
    if (!targetTable) {
      return res.status(404).json({
        success: false,
        message: 'Target table not found'
      });
    }

    // Check if name already exists in target table
    const existingView = await View.findOne({
      tableId: targetTableId,
      userId,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingView) {
      return res.status(400).json({
        success: false,
        message: 'View name already exists in target table'
      });
    }

    // Create copied view
    const copiedView = new View({
      tableId: targetTableId,
      userId,
      siteId: req.user.site_id?._id || req.site?._id,
      name,
      type: originalView.type,
      description: originalView.description,
      config: originalView.config,
      isDefault: false,
      isPublic: false,
      order: 0
    });

    await copiedView.save();
    await copiedView.populate('tableId', 'name description');

    res.status(201).json({
      success: true,
      message: 'View copied successfully',
      data: copiedView
    });

  } catch (error) {
    console.error('Error copying view:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
