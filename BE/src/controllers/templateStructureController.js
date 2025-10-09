import { TemplateMetadata } from '../models/Template.js';
import { TemplateStructure, TemplateTable, TemplateColumn } from '../models/Template.js';
import { hybridDbManager } from '../config/hybrid-db.js';

/**
 * TEMPLATE STRUCTURE CONTROLLER
 * 
 * Quản lý cấu trúc chi tiết của template (tables, columns)
 * Tương tự như TableController và ColumnController
 */

// ===========================================
// TEMPLATE TABLE MANAGEMENT
// ===========================================

// Create template table
export const createTemplateTable = async (req, res, next) => {
  try {
    const { template_id, name, description, structure = {}, order = 0 } = req.body;

    if (!template_id || !name) {
      return res.status(400).json({
        success: false,
        message: 'Template ID and name are required'
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

    // Create template table
    const templateTable = await TemplateTable.create({
      template_structure_id: template.structure_id,
      name,
      description,
      structure,
      order
    });

    res.status(201).json({
      success: true,
      message: 'Template table created successfully',
      data: templateTable
    });
  } catch (error) {
    next(error);
  }
};

// Get template tables
export const getTemplateTables = async (req, res, next) => {
  try {
    const { template_id } = req.params;
    const { page = 1, limit = 20, sort_by = 'order', sort_order = 'asc' } = req.query;

    // Verify template exists
    const template = await TemplateMetadata.findById(template_id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Get template tables
    const { count, rows: tables } = await TemplateTable.findAndCountAll({
      where: { template_structure_id: template.structure_id },
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: tables,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get template table by ID
export const getTemplateTableById = async (req, res, next) => {
  try {
    const { table_id } = req.params;

    const templateTable = await TemplateTable.findByPk(table_id, {
      include: [
        {
          model: TemplateColumn,
          as: 'columns',
          order: [['order', 'ASC']]
        }
      ]
    });

    if (!templateTable) {
      return res.status(404).json({
        success: false,
        message: 'Template table not found'
      });
    }

    res.json({
      success: true,
      data: templateTable
    });
  } catch (error) {
    next(error);
  }
};

// Update template table
export const updateTemplateTable = async (req, res, next) => {
  try {
    const { table_id } = req.params;
    const updateData = req.body;

    const templateTable = await TemplateTable.findByPk(table_id);
    if (!templateTable) {
      return res.status(404).json({
        success: false,
        message: 'Template table not found'
      });
    }

    // Check permission
    const template = await TemplateMetadata.findOne({ structure_id: templateTable.template_structure_id });
    if (template.created_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update template table
    await templateTable.update(updateData);

    res.json({
      success: true,
      message: 'Template table updated successfully',
      data: templateTable
    });
  } catch (error) {
    next(error);
  }
};

// Delete template table
export const deleteTemplateTable = async (req, res, next) => {
  try {
    const { table_id } = req.params;

    const templateTable = await TemplateTable.findByPk(table_id);
    if (!templateTable) {
      return res.status(404).json({
        success: false,
        message: 'Template table not found'
      });
    }

    // Check permission
    const template = await TemplateMetadata.findOne({ structure_id: templateTable.template_structure_id });
    if (template.created_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete template table (cascade delete columns)
    await templateTable.destroy();

    res.json({
      success: true,
      message: 'Template table deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Reorder template tables
export const reorderTemplateTables = async (req, res, next) => {
  try {
    const { template_id } = req.params;
    const { table_orders } = req.body; // [{table_id, order}, ...]

    if (!Array.isArray(table_orders)) {
      return res.status(400).json({
        success: false,
        message: 'Table orders must be an array'
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

    // Update table orders
    for (const { table_id, order } of table_orders) {
      await TemplateTable.update(
        { order },
        { where: { id: table_id, template_structure_id: template.structure_id } }
      );
    }

    res.json({
      success: true,
      message: 'Template tables reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ===========================================
// TEMPLATE COLUMN MANAGEMENT
// ===========================================

// Create template column
export const createTemplateColumn = async (req, res, next) => {
  try {
    const { 
      template_table_id, 
      name, 
      key, 
      data_type, 
      is_required = false, 
      is_unique = false, 
      default_value, 
      description, 
      config = {}, 
      order = 0 
    } = req.body;

    if (!template_table_id || !name || !key || !data_type) {
      return res.status(400).json({
        success: false,
        message: 'Template table ID, name, key, and data type are required'
      });
    }

    // Verify template table exists
    const templateTable = await TemplateTable.findByPk(template_table_id);
    if (!templateTable) {
      return res.status(404).json({
        success: false,
        message: 'Template table not found'
      });
    }

    // Check permission
    const template = await TemplateMetadata.findOne({ structure_id: templateTable.template_structure_id });
    if (template.created_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create template column
    const templateColumn = await TemplateColumn.create({
      template_table_id,
      name,
      key,
      data_type,
      is_required,
      is_unique,
      default_value,
      description,
      config,
      order
    });

    res.status(201).json({
      success: true,
      message: 'Template column created successfully',
      data: templateColumn
    });
  } catch (error) {
    next(error);
  }
};

// Get template columns
export const getTemplateColumns = async (req, res, next) => {
  try {
    const { table_id } = req.params;
    const { page = 1, limit = 20, sort_by = 'order', sort_order = 'asc' } = req.query;

    // Verify template table exists
    const templateTable = await TemplateTable.findByPk(table_id);
    if (!templateTable) {
      return res.status(404).json({
        success: false,
        message: 'Template table not found'
      });
    }

    // Get template columns
    const { count, rows: columns } = await TemplateColumn.findAndCountAll({
      where: { template_table_id: table_id },
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: columns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get template column by ID
export const getTemplateColumnById = async (req, res, next) => {
  try {
    const { column_id } = req.params;

    const templateColumn = await TemplateColumn.findByPk(column_id);

    if (!templateColumn) {
      return res.status(404).json({
        success: false,
        message: 'Template column not found'
      });
    }

    res.json({
      success: true,
      data: templateColumn
    });
  } catch (error) {
    next(error);
  }
};

// Update template column
export const updateTemplateColumn = async (req, res, next) => {
  try {
    const { column_id } = req.params;
    const updateData = req.body;

    const templateColumn = await TemplateColumn.findByPk(column_id);
    if (!templateColumn) {
      return res.status(404).json({
        success: false,
        message: 'Template column not found'
      });
    }

    // Check permission
    const templateTable = await TemplateTable.findByPk(templateColumn.template_table_id);
    const template = await TemplateMetadata.findOne({ structure_id: templateTable.template_structure_id });
    if (template.created_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update template column
    await templateColumn.update(updateData);

    res.json({
      success: true,
      message: 'Template column updated successfully',
      data: templateColumn
    });
  } catch (error) {
    next(error);
  }
};

// Delete template column
export const deleteTemplateColumn = async (req, res, next) => {
  try {
    const { column_id } = req.params;

    const templateColumn = await TemplateColumn.findByPk(column_id);
    if (!templateColumn) {
      return res.status(404).json({
        success: false,
        message: 'Template column not found'
      });
    }

    // Check permission
    const templateTable = await TemplateTable.findByPk(templateColumn.template_table_id);
    const template = await TemplateMetadata.findOne({ structure_id: templateTable.template_structure_id });
    if (template.created_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete template column
    await templateColumn.destroy();

    res.json({
      success: true,
      message: 'Template column deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Reorder template columns
export const reorderTemplateColumns = async (req, res, next) => {
  try {
    const { table_id } = req.params;
    const { column_orders } = req.body; // [{column_id, order}, ...]

    if (!Array.isArray(column_orders)) {
      return res.status(400).json({
        success: false,
        message: 'Column orders must be an array'
      });
    }

    // Verify template table exists
    const templateTable = await TemplateTable.findByPk(table_id);
    if (!templateTable) {
      return res.status(404).json({
        success: false,
        message: 'Template table not found'
      });
    }

    // Check permission
    const template = await TemplateMetadata.findOne({ structure_id: templateTable.template_structure_id });
    if (template.created_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update column orders
    for (const { column_id, order } of column_orders) {
      await TemplateColumn.update(
        { order },
        { where: { id: column_id, template_table_id: table_id } }
      );
    }

    res.json({
      success: true,
      message: 'Template columns reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};
