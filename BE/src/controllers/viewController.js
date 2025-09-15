import View from '../model/View.js';
import Table from '../model/Table.js';
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
    const userId = req.user._id;
    const siteId = req.user.site_id?._id || req.site?._id;

    // Verify table exists and user has access
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

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
    const userId = req.user._id;

    // Verify table exists
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Get views for this table (user's views + public views)
    const views = await View.find({
      tableId,
      $or: [
        { userId },
        { isPublic: true }
      ]
    })
    .populate('tableId', 'name description')
    .sort({ order: 1, createdAt: -1 });

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
    const userId = req.user._id;
    const { name, type, description, config, isDefault, isPublic } = req.body;

    // Find view and verify ownership
    const view = await View.findOne({
      _id: viewId,
      userId
    });

    if (!view) {
      return res.status(404).json({
        success: false,
        message: 'View not found or access denied'
      });
    }

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
    const userId = req.user._id;

    const view = await View.findOne({
      _id: viewId,
      userId
    });

    if (!view) {
      return res.status(404).json({
        success: false,
        message: 'View not found or access denied'
      });
    }

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
