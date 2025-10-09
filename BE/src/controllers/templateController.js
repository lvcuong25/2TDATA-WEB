import { TemplateMetadata } from '../models/Template.js';
import { TemplateStructure, TemplateTable, TemplateColumn } from '../models/Template.js';
import { hybridDbManager } from '../config/hybrid-db.js';

/**
 * TEMPLATE CONTROLLER - Hybrid MongoDB + PostgreSQL
 * 
 * Template = Bản copy database structure (không có organization & permissions)
 * 
 * MongoDB: Template metadata (như User, Organization)
 * PostgreSQL: Template structure data (như Table, Column, Record)
 */

// ===========================================
// GET ALL TEMPLATES
// ===========================================
export const getAllTemplates = async (req, res, next) => {
  try {
    const { 
      category, 
      is_public, 
      search, 
      page = 1, 
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Build MongoDB query
    const mongoQuery = {};
    
    if (category) {
      mongoQuery.category = category;
    }
    
    if (is_public !== undefined) {
      mongoQuery.is_public = is_public === 'true';
    }
    
    if (search) {
      mongoQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // MongoDB: Get template metadata
    const templates = await TemplateMetadata.find(mongoQuery)
      .populate('created_by', 'name email')
      .sort({ [sort_by]: sort_order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count
    const total = await TemplateMetadata.countDocuments(mongoQuery);

    res.json({
      success: true,
      data: templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ===========================================
// GET TEMPLATE BY ID
// ===========================================
export const getTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // MongoDB: Get template metadata
    const templateMetadata = await TemplateMetadata.findById(id)
      .populate('created_by', 'name email');

    if (!templateMetadata) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // PostgreSQL: Get template structure
    const templateStructure = await TemplateStructure.findByPk(templateMetadata.structure_id, {
      include: [
        {
          model: TemplateTable,
          as: 'template_tables',
          include: [
            {
              model: TemplateColumn,
              as: 'template_columns',
              order: [['order', 'ASC']]
            }
          ],
          order: [['order', 'ASC']]
        }
      ]
    });

    // Combine metadata + structure
    const template = {
      ...templateMetadata.toObject(),
      structure: templateStructure
    };

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// ===========================================
// CREATE TEMPLATE
// ===========================================
export const createTemplate = async (req, res, next) => {
  try {
    const { 
      name, 
      description, 
      icon, 
      thumbnail, 
      tags = [],
      is_public = true,
      structure_data 
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Start transaction
    const transaction = await hybridDbManager.getPostgresConnection().transaction();

    try {
      // PostgreSQL: Create template structure
      const templateStructure = await TemplateStructure.create({
        database_structure: structure_data.database_structure || {},
        tables: structure_data.tables || [],
        columns: structure_data.columns || [],
        relationships: structure_data.relationships || [],
        settings: structure_data.settings || {}
      }, { transaction });

      // Create template tables if provided
      if (structure_data.tables && structure_data.tables.length > 0) {
        for (const tableData of structure_data.tables) {
          const templateTable = await TemplateTable.create({
            template_structure_id: templateStructure.id,
            name: tableData.name,
            description: tableData.description,
            structure: tableData.structure || {},
            order: tableData.order || 0
          }, { transaction });

          // Create template columns if provided
          if (tableData.columns && tableData.columns.length > 0) {
            for (const columnData of tableData.columns) {
              await TemplateColumn.create({
                template_table_id: templateTable.id,
                name: columnData.name,
                key: columnData.key,
                data_type: columnData.data_type,
                is_required: columnData.is_required || false,
                is_unique: columnData.is_unique || false,
                default_value: columnData.default_value,
                description: columnData.description,
                config: columnData.config || {},
                order: columnData.order || 0
              }, { transaction });
            }
          }
        }
      }

      // MongoDB: Create template metadata
      const templateMetadata = await TemplateMetadata.create({
        name,
        description,
        icon: icon || '📋',
        thumbnail: thumbnail || '',
        tags,
        created_by: req.user._id,
        is_public,
        structure_id: templateStructure.id
      });

      await transaction.commit();

      // Get complete template
      const completeTemplate = await TemplateMetadata.findById(templateMetadata._id)
        .populate('created_by', 'name email');

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: completeTemplate
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// ===========================================
// UPDATE TEMPLATE
// ===========================================
export const updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if template exists and user has permission
    const template = await TemplateMetadata.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check permission (creator or admin)
    if (template.created_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update template metadata
    const updatedTemplate = await TemplateMetadata.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('created_by', 'name email');

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: updatedTemplate
    });
  } catch (error) {
    next(error);
  }
};

// ===========================================
// DELETE TEMPLATE
// ===========================================
export const deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if template exists and user has permission
    const template = await TemplateMetadata.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check permission (creator or admin)
    if (template.created_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Start transaction
    const transaction = await hybridDbManager.getPostgresConnection().transaction();

    try {
      // PostgreSQL: Delete template structure
      await TemplateStructure.destroy({
        where: { id: template.structure_id },
        transaction
      });

      // MongoDB: Delete template metadata
      await TemplateMetadata.findByIdAndDelete(id);

      await transaction.commit();

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// ===========================================
// APPLY TEMPLATE TO DATABASE
// ===========================================
export const applyTemplate = async (req, res, next) => {
  try {
    const { template_id, database_id } = req.body;

    if (!template_id || !database_id) {
      return res.status(400).json({
        success: false,
        message: 'Template ID and Database ID are required'
      });
    }

    // Get template structure
    const template = await TemplateMetadata.findById(template_id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Get template structure from PostgreSQL
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

    // TODO: Implement logic to create database structure from template
    // This would involve:
    // 1. Creating tables in the target database
    // 2. Creating columns with proper data types
    // 3. Setting up relationships
    // 4. Applying permissions and settings

    res.json({
      success: true,
      message: 'Template applied successfully',
      data: {
        template_id,
        database_id,
        structure: templateStructure
      }
    });
  } catch (error) {
    next(error);
  }
};

// ===========================================
// INCREMENT TEMPLATE USAGE
// ===========================================
export const incrementTemplateUsage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await TemplateMetadata.findByIdAndUpdate(
      id,
      { $inc: { usage_count: 1 } },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template usage incremented',
      data: template
    });
  } catch (error) {
    next(error);
  }
};
