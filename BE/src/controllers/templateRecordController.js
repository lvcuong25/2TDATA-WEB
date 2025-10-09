import { TemplateMetadata } from '../models/Template.js';
import { TemplateStructure, TemplateTable, TemplateColumn } from '../models/Template.js';
import { hybridDbManager } from '../config/hybrid-db.js';

/**
 * TEMPLATE RECORD CONTROLLER
 * 
 * Quản lý records mẫu trong template
 * Tương tự như recordController.js
 */

// ===========================================
// TEMPLATE RECORD MANAGEMENT
// ===========================================

// Create template record
export const createTemplateRecord = async (req, res, next) => {
  try {
    const { template_id, table_id, data } = req.body;

    if (!template_id || !table_id || !data) {
      return res.status(400).json({
        success: false,
        message: 'Template ID, table ID, and data are required'
      });
    }

    // Verify template exists
    const template = await TemplateMetadata.findById(template_id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check permission
    if (template.created_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // TODO: Implement template record creation
    // This would involve creating sample data records in the template structure

    res.status(201).json({
      success: true,
      message: 'Template record created successfully',
      data: {
        template_id,
        table_id,
        data,
        created_by: req.user._id,
        created_at: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get template records
export const getTemplateRecords = async (req, res, next) => {
  try {
    const { template_id, table_id } = req.params;
    const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = req.query;

    // Verify template exists
    const template = await TemplateMetadata.findById(template_id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // TODO: Implement template records retrieval
    // This would involve getting sample data records from the template structure

    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get template record by ID
export const getTemplateRecordById = async (req, res, next) => {
  try {
    const { record_id } = req.params;

    // TODO: Implement template record retrieval by ID
    // This would involve getting a specific sample data record

    res.json({
      success: true,
      data: {
        id: record_id,
        template_id: req.params.template_id,
        table_id: req.params.table_id,
        data: {},
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update template record
export const updateTemplateRecord = async (req, res, next) => {
  try {
    const { record_id } = req.params;
    const updateData = req.body;

    // TODO: Implement template record update
    // This would involve updating sample data records

    res.json({
      success: true,
      message: 'Template record updated successfully',
      data: {
        id: record_id,
        ...updateData,
        updated_at: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete template record
export const deleteTemplateRecord = async (req, res, next) => {
  try {
    const { record_id } = req.params;

    // TODO: Implement template record deletion
    // This would involve removing sample data records

    res.json({
      success: true,
      message: 'Template record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete multiple template records
export const deleteMultipleTemplateRecords = async (req, res, next) => {
  try {
    const { record_ids } = req.body;

    if (!Array.isArray(record_ids) || record_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Record IDs array is required'
      });
    }

    // TODO: Implement multiple template record deletion
    // This would involve removing multiple sample data records

    res.json({
      success: true,
      message: `${record_ids.length} template records deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Get template structure
export const getTemplateStructure = async (req, res, next) => {
  try {
    const { template_id } = req.params;

    // Get template structure
    const template = await TemplateMetadata.findById(template_id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const templateStructure = await TemplateStructure.findByPk(template.structure_id, {
      include: [
        {
          model: TemplateTable,
          as: 'tables',
          include: [
            {
              model: TemplateColumn,
              as: 'columns',
              order: [['order', 'ASC']]
            }
          ],
          order: [['order', 'ASC']]
        }
      ]
    });

    res.json({
      success: true,
      data: {
        template_id,
        structure: templateStructure,
        metadata: template
      }
    });
  } catch (error) {
    next(error);
  }
};
