import { TemplateMetadata } from '../models/Template.js';
import { TemplateStructure, TemplateTable, TemplateColumn } from '../models/Template.js';
import { hybridDbManager } from '../config/hybrid-db.js';

/**
 * TEMPLATE ADVANCED CONTROLLER
 * 
 * Các tính năng nâng cao cho template system
 * Tương tự như các tính năng advanced của database
 */

// ===========================================
// TEMPLATE COPY & DUPLICATE
// ===========================================

// Copy template
export const copyTemplate = async (req, res, next) => {
  try {
    const { template_id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'New template name is required'
      });
    }

    // Get original template
    const originalTemplate = await TemplateMetadata.findById(template_id);
    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Get original template structure
    const originalStructure = await TemplateStructure.findByPk(originalTemplate.structure_id, {
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

    if (!originalStructure) {
      return res.status(404).json({
        success: false,
        message: 'Template structure not found'
      });
    }

    // Start transaction
    const transaction = await hybridDbManager.getPostgresConnection().transaction();

    try {
      // Create new template structure
      const newStructure = await TemplateStructure.create({
        database_structure: originalStructure.database_structure,
        tables: originalStructure.tables,
        columns: originalStructure.columns,
        relationships: originalStructure.relationships,
        settings: originalStructure.settings
      }, { transaction });

      // Copy template tables
      for (const table of originalStructure.tables) {
        const newTable = await TemplateTable.create({
          template_structure_id: newStructure.id,
          name: table.name,
          description: table.description,
          structure: table.structure,
          order: table.order
        }, { transaction });

        // Copy template columns
        for (const column of table.columns) {
          await TemplateColumn.create({
            template_table_id: newTable.id,
            name: column.name,
            key: column.key,
            data_type: column.data_type,
            is_required: column.is_required,
            is_unique: column.is_unique,
            default_value: column.default_value,
            description: column.description,
            config: column.config,
            order: column.order
          }, { transaction });
        }
      }

      // Create new template metadata
      const newTemplate = await TemplateMetadata.create({
        name,
        description: description || originalTemplate.description,
        category: originalTemplate.category,
        icon: originalTemplate.icon,
        thumbnail: originalTemplate.thumbnail,
        tags: originalTemplate.tags,
        created_by: req.user._id,
        is_public: false, // Copy is private by default
        structure_id: newStructure.id,
        version: '1.0.0'
      });

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: 'Template copied successfully',
        data: newTemplate
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Duplicate template
export const duplicateTemplate = async (req, res, next) => {
  try {
    const { template_id } = req.params;

    // Get original template
    const originalTemplate = await TemplateMetadata.findById(template_id);
    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Create duplicate with incremented usage count
    await TemplateMetadata.findByIdAndUpdate(
      template_id,
      { $inc: { usage_count: 1 } }
    );

    res.json({
      success: true,
      message: 'Template duplicated successfully',
      data: { template_id, usage_count: originalTemplate.usage_count + 1 }
    });
  } catch (error) {
    next(error);
  }
};

// ===========================================
// TEMPLATE EXPORT & IMPORT
// ===========================================

// Export template
export const exportTemplate = async (req, res, next) => {
  try {
    const { template_id } = req.params;
    const { format = 'json' } = req.query;

    // Get template with full structure
    const template = await TemplateMetadata.findById(template_id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
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
              as: 'columns',
              order: [['order', 'ASC']]
            }
          ],
          order: [['order', 'ASC']]
        }
      ]
    });

    // Prepare export data
    const exportData = {
      template: {
        name: template.name,
        description: template.description,
        category: template.category,
        icon: template.icon,
        thumbnail: template.thumbnail,
        tags: template.tags,
        version: template.version
      },
      structure: {
        database_structure: templateStructure.database_structure,
        tables: templateStructure.tables,
        columns: templateStructure.columns,
        relationships: templateStructure.relationships,
        settings: templateStructure.settings
      },
      metadata: {
        exported_at: new Date(),
        exported_by: req.user._id,
        format
      }
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${template.name}_template.json"`);
      res.json(exportData);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported export format'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Import template
export const importTemplate = async (req, res, next) => {
  try {
    const { template_data } = req.body;

    if (!template_data || !template_data.template || !template_data.structure) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template data format'
      });
    }

    // Validate template data
    const validation = validateTemplateData(template_data);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template data',
        errors: validation.errors
      });
    }

    // Start transaction
    const transaction = await hybridDbManager.getPostgresConnection().transaction();

    try {
      // Create template structure
      const templateStructure = await TemplateStructure.create({
        database_structure: template_data.structure.database_structure || {},
        tables: template_data.structure.tables || [],
        columns: template_data.structure.columns || [],
        relationships: template_data.structure.relationships || [],
        settings: template_data.structure.settings || {}
      }, { transaction });

      // Create template tables
      if (template_data.structure.tables && template_data.structure.tables.length > 0) {
        for (const tableData of template_data.structure.tables) {
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

      // Create template metadata
      const template = await TemplateMetadata.create({
        name: template_data.template.name,
        description: template_data.template.description,
        category: template_data.template.category,
        icon: template_data.template.icon || '📋',
        thumbnail: template_data.template.thumbnail || '',
        tags: template_data.template.tags || [],
        created_by: req.user._id,
        is_public: false, // Imported templates are private by default
        structure_id: templateStructure.id,
        version: template_data.template.version || '1.0.0'
      });

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: 'Template imported successfully',
        data: template
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
// TEMPLATE VALIDATION
// ===========================================

// Validate template
export const validateTemplate = async (req, res, next) => {
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
              as: 'columns'
            }
          ]
        }
      ]
    });

    // Validate template structure
    const validation = validateTemplateStructure(templateStructure);
    
    res.json({
      success: true,
      data: {
        template_id,
        is_valid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        statistics: {
          tables_count: templateStructure.tables.length,
          columns_count: templateStructure.tables.reduce((total, table) => total + table.columns.length, 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ===========================================
// TEMPLATE STATISTICS
// ===========================================

// Get template statistics
export const getTemplateStatistics = async (req, res, next) => {
  try {
    const { template_id } = req.params;

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
              as: 'columns'
            }
          ]
        }
      ]
    });

    const statistics = {
      template_id,
      name: template.name,
      usage_count: template.usage_count,
      rating: template.rating,
      tables_count: templateStructure.tables.length,
      columns_count: templateStructure.tables.reduce((total, table) => total + table.columns.length, 0),
      created_at: template.created_at,
      updated_at: template.updated_at,
      created_by: template.created_by,
      is_public: template.is_public,
      category: template.category,
      version: template.version
    };

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};

// ===========================================
// TEMPLATE SEARCH & CATEGORIES
// ===========================================

// Search templates
export const searchTemplates = async (req, res, next) => {
  try {
    const { 
      query, 
      category, 
      tags, 
      is_public, 
      min_rating, 
      max_rating, 
      sort_by = 'created_at', 
      sort_order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build search query
    const searchQuery = {};

    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ];
    }

    if (category) {
      searchQuery.category = category;
    }

    if (tags && tags.length > 0) {
      searchQuery.tags = { $in: tags };
    }

    if (is_public !== undefined) {
      searchQuery.is_public = is_public === 'true';
    }

    if (min_rating !== undefined) {
      searchQuery.rating = { $gte: parseFloat(min_rating) };
    }

    if (max_rating !== undefined) {
      searchQuery.rating = { ...searchQuery.rating, $lte: parseFloat(max_rating) };
    }

    // Execute search
    const templates = await TemplateMetadata.find(searchQuery)
      .populate('created_by', 'name email')
      .sort({ [sort_by]: sort_order === 'desc' ? -1 : 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await TemplateMetadata.countDocuments(searchQuery);

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

// Get template categories
export const getTemplateCategories = async (req, res, next) => {
  try {
    const categories = await TemplateMetadata.distinct('category');
    const categoryStats = await TemplateMetadata.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avg_rating: { $avg: '$rating' },
          total_usage: { $sum: '$usage_count' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        categories,
        statistics: categoryStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

// Validate template data
const validateTemplateData = (templateData) => {
  const errors = [];
  const warnings = [];

  // Validate template metadata
  if (!templateData.template.name) {
    errors.push('Template name is required');
  }

  if (!templateData.template.category) {
    errors.push('Template category is required');
  }

  // Validate structure
  if (!templateData.structure) {
    errors.push('Template structure is required');
  }

  if (templateData.structure.tables && !Array.isArray(templateData.structure.tables)) {
    errors.push('Template tables must be an array');
  }

  if (templateData.structure.columns && !Array.isArray(templateData.structure.columns)) {
    errors.push('Template columns must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Validate template structure
const validateTemplateStructure = (templateStructure) => {
  const errors = [];
  const warnings = [];

  if (!templateStructure.tables || templateStructure.tables.length === 0) {
    warnings.push('Template has no tables');
  }

  if (templateStructure.tables) {
    templateStructure.tables.forEach((table, index) => {
      if (!table.name) {
        errors.push(`Table ${index} has no name`);
      }
      if (!table.columns || table.columns.length === 0) {
        warnings.push(`Table ${index} has no columns`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
