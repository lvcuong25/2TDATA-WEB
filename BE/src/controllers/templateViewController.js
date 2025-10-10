import { TemplateMetadata } from '../models/Template.js';
import { TemplateStructure, TemplateTable, TemplateColumn } from '../models/Template.js';
import { hybridDbManager } from '../config/hybrid-db.js';
import { TableTemplate, TemplateTable as LegacyTemplateTable } from '../model/TableTemplate.js';
import { randomUUID } from 'crypto';

/**
 * TEMPLATE VIEW CONTROLLER
 * 
 * Quản lý views trong template
 * Tương tự như viewController.js
 */

// ===========================================
// TEMPLATE VIEW MANAGEMENT
// ===========================================

// Create template view
export const createTemplateView = async (req, res, next) => {
  try {
    console.log('🚀 CREATE TEMPLATE VIEW CALLED!');
    console.log('📝 Request body:', req.body);
    console.log('📝 Request params:', req.params);
    
    const { templateId, tableIndex, name, type, description, config, isDefault, isPublic } = req.body;

    if (!templateId || tableIndex === undefined || !name || !type) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Template ID, table index, name, and type are required'
      });
    }

    // Check if UUID (PostgreSQL) or ObjectId (MongoDB)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateId);

    if (isUUID) {
      // Legacy: PostgreSQL template
      const template = await TableTemplate.findByPk(templateId, {
        include: [{
          model: LegacyTemplateTable,
          as: 'tables'
        }]
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Check permission (super admin only)
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can modify templates'
        });
      }

      // Get tables array
      const tables = template.tables || [];
      const index = parseInt(tableIndex);
      if (index < 0 || index >= tables.length) {
        return res.status(404).json({
          success: false,
          message: 'Table not found'
        });
      }

      // Create new view
      const newView = {
        _id: randomUUID(),
        name,
        type,
        description: description || '',
        config: config || {},
        isDefault: isDefault || false,
        isPublic: isPublic || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add view to table
      const tableData = tables[index].toJSON();
      console.log('📋 Current table data:', tableData);
      console.log('📋 Current views:', tableData.views);
      if (!tableData.views) {
        tableData.views = [];
      }
      tableData.views.push(newView);
      console.log('📋 Views after push:', tableData.views);
      console.log('📋 New view:', newView);

      // Update table
      try {
        const updateResult = await tables[index].update({ views: tableData.views });
        console.log('✅ Table updated successfully:', updateResult.toJSON());
        console.log('✅ Updated views:', updateResult.views);
      } catch (updateError) {
        console.error('❌ Error updating table views:', updateError);
        throw updateError;
      }

      return res.status(201).json({
        success: true,
        message: 'Template view created successfully',
        data: newView
      });
    }

    // MongoDB template
    const template = await TemplateMetadata.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check permission (super admin only)
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can modify templates'
      });
    }

    // Get tables array
    const tables = template.tables || [];
    const index = parseInt(tableIndex);
    if (index < 0 || index >= tables.length) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Create new view
    const newView = {
      _id: randomUUID(),
      name,
      type,
      description: description || '',
      config: config || {},
      isDefault: isDefault || false,
      isPublic: isPublic || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add view to table
    if (!tables[index].views) {
      tables[index].views = [];
    }
    tables[index].views.push(newView);

    // Update template
    template.tables = tables;
    await template.save();

    return res.status(201).json({
      success: true,
      message: 'Template view created successfully',
      data: newView
    });
  } catch (error) {
    next(error);
  }
};

// Get template views
export const getTemplateViews = async (req, res, next) => {
  try {
    const { templateId, tableIndex } = req.params;

    // Check if UUID (PostgreSQL) or ObjectId (MongoDB)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateId);

    if (isUUID) {
      // Legacy: PostgreSQL template
      const template = await TableTemplate.findByPk(templateId, {
        include: [{
          model: LegacyTemplateTable,
          as: 'tables'
        }]
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Get tables array
      const tables = template.tables || [];
      console.log('📊 GET: Total tables:', tables.length);
      const index = parseInt(tableIndex);
      console.log('📊 GET: Requested table index:', index);
      if (index < 0 || index >= tables.length) {
        return res.status(404).json({
          success: false,
          message: 'Table not found'
        });
      }

      console.log('📊 GET: Table at index', index, ':', tables[index].toJSON ? tables[index].toJSON() : tables[index]);
      // Get views for this table
      const views = tables[index].views || [];
      console.log('📊 GET: Views for table', index, ':', views);
      console.log('📊 GET: Views length:', views.length);

      return res.json({
        success: true,
        data: views
      });
    }

    // MongoDB template
    const template = await TemplateMetadata.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Get tables array
    const tables = template.tables || [];
    const index = parseInt(tableIndex);
    if (index < 0 || index >= tables.length) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Get views for this table
    const views = tables[index].views || [];

    res.json({
      success: true,
      data: views
    });
  } catch (error) {
    next(error);
  }
};

// Get template view by ID
export const getTemplateViewById = async (req, res, next) => {
  try {
    const { view_id } = req.params;

    // TODO: Implement template view retrieval by ID
    // This would involve getting a specific view configuration

    res.json({
      success: true,
      data: {
        id: view_id,
        template_id: req.params.template_id,
        name: 'Sample View',
        description: 'Sample view description',
        view_type: 'table',
        config: {},
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update template view
export const updateTemplateView = async (req, res, next) => {
  try {
    const { view_id } = req.params;
    const updateData = req.body;

    // TODO: Implement template view update
    // This would involve updating view configurations

    res.json({
      success: true,
      message: 'Template view updated successfully',
      data: {
        id: view_id,
        ...updateData,
        updated_at: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete template view
export const deleteTemplateView = async (req, res, next) => {
  try {
    const { view_id } = req.params;

    // TODO: Implement template view deletion
    // This would involve removing view configurations

    res.json({
      success: true,
      message: 'Template view deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Copy template view
export const copyTemplateView = async (req, res, next) => {
  try {
    const { view_id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'New view name is required'
      });
    }

    // TODO: Implement template view copying
    // This would involve duplicating view configurations

    res.status(201).json({
      success: true,
      message: 'Template view copied successfully',
      data: {
        original_view_id: view_id,
        new_name: name,
        new_description: description,
        created_by: req.user._id,
        created_at: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};
