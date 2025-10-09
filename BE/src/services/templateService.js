import { TemplateMetadata } from '../models/Template.js';
import { TemplateStructure, TemplateTable, TemplateColumn } from '../models/Template.js';
import { hybridDbManager } from '../config/hybrid-db.js';

/**
 * TEMPLATE SERVICE - Business Logic
 * 
 * Template = Bản copy database structure (không có organization & permissions)
 * 
 * MongoDB: Template metadata (như User, Organization)
 * PostgreSQL: Template structure data (như Table, Column, Record)
 */

// ===========================================
// TEMPLATE CREATION SERVICE
// ===========================================

/**
 * Create template from existing database structure
 * @param {Object} databaseStructure - Database structure to copy
 * @param {Object} templateMetadata - Template metadata
 * @returns {Object} Created template
 */
export const createTemplateFromDatabase = async (databaseStructure, templateMetadata) => {
  try {
    // Start transaction
    const transaction = await hybridDbManager.getPostgresConnection().transaction();

    try {
      // PostgreSQL: Create template structure
      const templateStructure = await TemplateStructure.create({
        database_structure: databaseStructure,
        tables: databaseStructure.tables || [],
        columns: databaseStructure.columns || [],
        relationships: databaseStructure.relationships || [],
        settings: databaseStructure.settings || {}
      }, { transaction });

      // Create template tables
      if (databaseStructure.tables && databaseStructure.tables.length > 0) {
        for (const tableData of databaseStructure.tables) {
          const templateTable = await TemplateTable.create({
            template_structure_id: templateStructure.id,
            name: tableData.name,
            description: tableData.description,
            structure: tableData.structure || {},
            order: tableData.order || 0
          }, { transaction });

          // Create template columns
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
      const template = await TemplateMetadata.create({
        ...templateMetadata,
        structure_id: templateStructure.id
      });

      await transaction.commit();

      return template;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to create template: ${error.message}`);
  }
};

// ===========================================
// TEMPLATE APPLICATION SERVICE
// ===========================================

/**
 * Apply template to create new database structure
 * @param {String} templateId - Template ID
 * @param {String} databaseId - Target database ID
 * @param {String} userId - User ID
 * @returns {Object} Applied database structure
 */
export const applyTemplateToDatabase = async (templateId, databaseId, userId) => {
  try {
    // Get template structure
    const template = await TemplateMetadata.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
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

    if (!templateStructure) {
      throw new Error('Template structure not found');
    }

    // TODO: Implement database creation logic
    // This would involve:
    // 1. Creating database schema
    // 2. Creating tables with proper structure
    // 3. Creating columns with data types
    // 4. Setting up relationships
    // 5. Applying permissions

    const appliedStructure = {
      database_id,
      template_id: templateId,
      structure: templateStructure,
      created_by: userId,
      created_at: new Date()
    };

    return appliedStructure;
  } catch (error) {
    throw new Error(`Failed to apply template: ${error.message}`);
  }
};

// ===========================================
// TEMPLATE VALIDATION SERVICE
// ===========================================

/**
 * Validate template structure
 * @param {Object} templateStructure - Template structure to validate
 * @returns {Object} Validation result
 */
export const validateTemplateStructure = (templateStructure) => {
  const errors = [];
  const warnings = [];

  // Validate required fields
  if (!templateStructure.tables || !Array.isArray(templateStructure.tables)) {
    errors.push('Template must have tables array');
  }

  if (!templateStructure.columns || !Array.isArray(templateStructure.columns)) {
    errors.push('Template must have columns array');
  }

  // Validate tables
  if (templateStructure.tables) {
    templateStructure.tables.forEach((table, index) => {
      if (!table.name) {
        errors.push(`Table ${index} must have name`);
      }
      if (!table.structure) {
        warnings.push(`Table ${index} has no structure defined`);
      }
    });
  }

  // Validate columns
  if (templateStructure.columns) {
    templateStructure.columns.forEach((column, index) => {
      if (!column.name) {
        errors.push(`Column ${index} must have name`);
      }
      if (!column.data_type) {
        errors.push(`Column ${index} must have data_type`);
      }
      if (!column.template_table_id) {
        errors.push(`Column ${index} must have template_table_id`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// ===========================================
// TEMPLATE SEARCH SERVICE
// ===========================================

/**
 * Search templates with advanced filters
 * @param {Object} filters - Search filters
 * @returns {Array} Search results
 */
export const searchTemplates = async (filters) => {
  try {
    const {
      query,
      category,
      tags,
      is_public,
      created_by,
      min_rating,
      max_rating,
      sort_by = 'created_at',
      sort_order = 'desc',
      page = 1,
      limit = 20
    } = filters;

    // Build MongoDB query
    const mongoQuery = {};

    if (query) {
      mongoQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ];
    }

    if (category) {
      mongoQuery.category = category;
    }

    if (tags && tags.length > 0) {
      mongoQuery.tags = { $in: tags };
    }

    if (is_public !== undefined) {
      mongoQuery.is_public = is_public;
    }

    if (created_by) {
      mongoQuery.created_by = created_by;
    }

    if (min_rating !== undefined) {
      mongoQuery.rating = { $gte: min_rating };
    }

    if (max_rating !== undefined) {
      mongoQuery.rating = { ...mongoQuery.rating, $lte: max_rating };
    }

    // Execute query
    const templates = await TemplateMetadata.find(mongoQuery)
      .populate('created_by', 'name email')
      .sort({ [sort_by]: sort_order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TemplateMetadata.countDocuments(mongoQuery);

    return {
      templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new Error(`Failed to search templates: ${error.message}`);
  }
};

// ===========================================
// TEMPLATE STATISTICS SERVICE
// ===========================================

/**
 * Get template statistics
 * @param {String} templateId - Template ID
 * @returns {Object} Template statistics
 */
export const getTemplateStatistics = async (templateId) => {
  try {
    const template = await TemplateMetadata.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Get template structure
    const templateStructure = await TemplateStructure.findByPk(template.structure_id, {
      include: [
        {
          model: TemplateTable,
          as: 'tables',
          include: [
            {
              model: TemplateColumn,
              as: 'columns'
            }
          ]
        }
      ]
    });

    const statistics = {
      template_id: templateId,
      name: template.name,
      usage_count: template.usage_count,
      rating: template.rating,
      tables_count: templateStructure.tables.length,
      columns_count: templateStructure.tables.reduce((total, table) => total + table.columns.length, 0),
      created_at: template.created_at,
      updated_at: template.updated_at
    };

    return statistics;
  } catch (error) {
    throw new Error(`Failed to get template statistics: ${error.message}`);
  }
};
