import { Op } from 'sequelize';
import { TableTemplate, TemplateTable, TemplateColumn } from '../model/TableTemplate.js';
import TemplateCategory from '../model/TemplateCategory.js';
import Database from '../model/Database.js';
import { Table, Column, Record, TemplateRecord } from '../models/postgres/index.js';
import User from '../model/User.js';
import exprEvalEngine from '../utils/exprEvalEngine.js';

// Calculate formula columns for template records
const calculateFormulaColumnsForTemplate = (records, columns) => {
  return records.map(record => {
    const recordData = { ...record.data };
    
    // Find all formula columns
    const formulaColumns = columns.filter(col => col.data_type === 'formula');
    
    // Calculate each formula
    formulaColumns.forEach(formulaColumn => {
      try {
        const formula = formulaColumn.config?.formulaConfig?.formula;
        if (formula) {
          const formulaValue = exprEvalEngine.evaluateFormula(
            formula,
            recordData,
            columns
          );
          recordData[formulaColumn.name] = formulaValue;
        }
      } catch (error) {
        console.error(`Error evaluating formula for column ${formulaColumn.name}:`, error);
        recordData[formulaColumn.name] = null;
      }
    });
    
    return {
      ...record,
      data: recordData
    };
  });
};

// Calculate lookup columns for template records
const calculateLookupColumnsForTemplate = async (records, columns, templateId, tableIndex) => {
  try {
    const lookupColumns = columns.filter(col => col.data_type === 'lookup' && col.config?.lookupConfig);
    
    if (lookupColumns.length === 0) {
      return records;
    }
    
    // Calculate lookup values for each record
    const enhancedRecords = await Promise.all(records.map(async record => {
      const enhancedRecord = { ...record };
      
      // Calculate each lookup column
      for (const lookupColumn of lookupColumns) {
        try {
          const lookupConfig = lookupColumn.config?.lookupConfig;
          
          if (!lookupConfig || !lookupConfig.linkedTableId || !lookupConfig.lookupColumnId) {
            console.warn(`Invalid lookup config for column ${lookupColumn.name}`);
            continue;
          }
          
          // Find the linked_table column that this lookup depends on
          const linkedColumn = columns.find(col => 
            col.data_type === 'linked_table' && 
            col.config?.linkedTableConfig?.linkedTableId === lookupConfig.linkedTableId
          );
          
          if (!linkedColumn) {
            console.warn(`No linked table column found for lookup ${lookupColumn.name}`);
            continue;
          }
          
          // Get the linked record ID from the linked_table column
          const linkedTableValue = enhancedRecord.data?.[linkedColumn.name];
          if (!linkedTableValue || !linkedTableValue.recordId) {
            continue;
          }
          
          // Get the linked template table to find its table_index
          const linkedTemplateTable = await TemplateTable.findByPk(lookupConfig.linkedTableId);
          if (!linkedTemplateTable) {
            console.warn(`Linked template table not found: ${lookupConfig.linkedTableId}`);
            continue;
          }
          
          // Get all tables in template to find table index
          const allTablesInTemplate = await TemplateTable.findAll({
            where: { template_id: linkedTemplateTable.template_id },
            order: [['order', 'ASC']]
          });
          
          const linkedTableIndex = allTablesInTemplate.findIndex(t => t.id === lookupConfig.linkedTableId);
          if (linkedTableIndex === -1) {
            console.warn(`Linked table index not found for ${lookupConfig.linkedTableId}`);
            continue;
          }
          
          // Get the linked record from TemplateRecord
          const linkedRecord = await TemplateRecord.findByPk(linkedTableValue.recordId);
          if (!linkedRecord) {
            console.warn(`Linked record not found: ${linkedTableValue.recordId}`);
            continue;
          }
          
          // Get the lookup column from the linked table
          const lookupColumnInLinkedTable = await TemplateColumn.findByPk(lookupConfig.lookupColumnId);
          if (!lookupColumnInLinkedTable) {
            console.warn(`Lookup column not found in linked table: ${lookupConfig.lookupColumnId}`);
            continue;
          }
          
          // Extract the value from the linked record
          const lookupValue = linkedRecord.data?.[lookupColumnInLinkedTable.name];
          
          // Create proper lookup display value
          let displayValue = null;
          if (lookupValue && String(lookupValue).trim()) {
            displayValue = {
              value: linkedRecord.id,
              label: String(lookupValue),
              sourceField: lookupColumnInLinkedTable.name,
              sourceData: linkedRecord.data
            };
          }
          
          // Add calculated value to record data
          if (!enhancedRecord.data) enhancedRecord.data = {};
          enhancedRecord.data[lookupColumn.name] = displayValue;
          
        } catch (error) {
          console.error(`Error calculating lookup for column ${lookupColumn.name}:`, error);
          if (!enhancedRecord.data) enhancedRecord.data = {};
          enhancedRecord.data[lookupColumn.name] = null;
        }
      }
      
      return enhancedRecord;
    }));
    
    return enhancedRecords;
    
  } catch (error) {
    console.error('Error calculating lookup columns for template:', error);
    return records;
  }
};

// Get all public templates (for regular users)
export const getPublicTemplates = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    
    // Build where clause
    const where = { is_public: true };
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.contains]: [search] } }
      ];
    }
    
    // Get templates with pagination
    const { count, rows: templates } = await TableTemplate.findAndCountAll({
      where,
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
      ],
      order: [['usage_count', 'DESC'], ['rating', 'DESC'], ['created_at', 'DESC']],
      offset: (page - 1) * limit,
      limit: parseInt(limit)
    });
    
    res.status(200).json({
      success: true,
      data: templates,
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

// Get template by ID (for preview)
export const getTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const template = await TableTemplate.findByPk(id, {
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
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    // Check if template is public or user is super admin
    if (!template.is_public && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// Copy template to create new database with tables (for regular users)
export const copyTemplateToDatabase = async (req, res, next) => {
  try {
    const { templateId } = req.params;
    const { databaseName, databaseDescription, includeSampleData = false } = req.body;
    
    // Get template with tables and columns
    const template = await TableTemplate.findByPk(templateId, {
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
    
    if (!template || !template.is_public) {
      return res.status(404).json({
        success: false,
        message: 'Template not found or not available'
      });
    }
    
    // Create new database
    const newDatabase = new Database({
      name: databaseName,
      description: databaseDescription || template.description,
      userId: String(req.user._id),
      siteId: req.user.site_id
    });
    
    await newDatabase.save();
    
    // Create tables from template
    const createdTables = [];
    
    for (const templateTable of template.tables || []) {
      // Create table
      const newTable = await Table.create({
        name: templateTable.name,
        description: templateTable.description,
        database_id: newDatabase._id,
        user_id: String(req.user._id),
        site_id: req.user.site_id
      });
      
      // Create columns for this table
      for (const templateColumn of templateTable.columns || []) {
        await Column.create({
          name: templateColumn.name,
          key: templateColumn.key,
          data_type: templateColumn.data_type,
          is_required: templateColumn.is_required,
          is_unique: templateColumn.is_unique,
          default_value: templateColumn.default_value,
          description: templateColumn.description,
          config: templateColumn.config,
          table_id: newTable.id,
          user_id: String(req.user._id),
          site_id: req.user.site_id
        });
      }
      
      // Add sample data if requested (Note: sample data is not stored in PostgreSQL template structure)
      // This would need to be handled differently if sample data is needed
      
      createdTables.push({
        tableId: newTable.id,
        tableName: newTable.name
      });
    }
    
    // Update usage count
    await template.increment('usage_count');
    
    res.status(201).json({
      success: true,
      message: 'Database created successfully from template',
      data: {
        databaseId: newDatabase._id,
        databaseName: newDatabase.name,
        tables: createdTables
      }
    });
  } catch (error) {
    next(error);
  }
};

// ========== SUPER ADMIN ONLY ENDPOINTS ==========

// Get all templates (Super Admin only)
export const getAllTemplates = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { category, search, page = 1, limit = 12 } = req.query;
    
    // Build where clause
    const where = {};
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.contains]: [search] } }
      ];
    }
    
    const { count, rows: templates } = await TableTemplate.findAndCountAll({
      where,
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
      ],
      order: [['created_at', 'DESC']],
      offset: (page - 1) * limit,
      limit: parseInt(limit)
    });
    
    res.status(200).json({
      success: true,
      data: {
        templates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new template (Super Admin only)
export const createTemplate = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { tables, ...templateData } = req.body;
    
    // Create template
    const template = await TableTemplate.create({
      ...templateData,
      created_by: String(req.user._id)
    });
    
    // Create tables and columns if provided
    if (tables && tables.length > 0) {
      for (const tableData of tables) {
        const { columns, ...tableInfo } = tableData;
        
        const templateTable = await TemplateTable.create({
          ...tableInfo,
          template_id: template.id,
          order: tableData.order || 0
        });
        
        // Create columns if provided
        if (columns && columns.length > 0) {
          for (const columnData of columns) {
            await TemplateColumn.create({
              ...columnData,
              template_table_id: templateTable.id,
              order: columnData.order || 0
            });
          }
        }
      }
    }
    
    // Fetch the complete template with relations
    const completeTemplate = await TableTemplate.findByPk(template.id, {
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
    
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: completeTemplate
    });
  } catch (error) {
    next(error);
  }
};

// Update template (Super Admin only)
export const updateTemplate = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { id } = req.params;
    const { tables, ...templateData } = req.body;
    
    const template = await TableTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    // Update template basic info
    await template.update(templateData);
    
    // Update tables and columns if provided
    if (tables) {
      // Delete existing tables and columns (cascade will handle columns)
      await TemplateTable.destroy({
        where: { template_id: id }
      });
      
      // Create new tables and columns
      for (const tableData of tables) {
        const { columns, ...tableInfo } = tableData;
        
        const templateTable = await TemplateTable.create({
          ...tableInfo,
          template_id: id,
          order: tableData.order || 0
        });
        
        // Create columns if provided
        if (columns && columns.length > 0) {
          for (const columnData of columns) {
            await TemplateColumn.create({
              ...columnData,
              template_table_id: templateTable.id,
              order: columnData.order || 0
            });
          }
        }
      }
    }
    
    // Fetch the complete updated template
    const updatedTemplate = await TableTemplate.findByPk(id, {
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
    
    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: updatedTemplate
    });
  } catch (error) {
    next(error);
  }
};

// Delete template (Super Admin only)
export const deleteTemplate = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { id } = req.params;
    
    const template = await TableTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    // Delete template (cascade will handle tables and columns)
    await template.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Create template from existing database (Super Admin only)
export const createTemplateFromDatabase = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { databaseId, templateName, templateDescription, category, includeSampleData = false } = req.body;
    
    // Get database with tables
    const database = await Database.findById(databaseId);
    if (!database) {
      return res.status(404).json({
        success: false,
        message: 'Database not found'
      });
    }
    
    // Get tables for this database
    const tables = await Table.findAll({ 
      where: { database_id: databaseId },
      include: [
        {
          model: Column,
          as: 'columns',
          order: [['order', 'ASC']]
        }
      ],
      order: [['created_at', 'ASC']]
    });
    
    if (tables.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Database has no tables'
      });
    }
    
    // Create template
    const template = await TableTemplate.create({
      name: templateName,
      description: templateDescription,
      category: category || 'Other',
      icon: '📋',
      tags: [database.name, 'Database Template'],
      created_by: String(req.user._id),
      is_public: true,
      complexity: 'beginner',
      estimated_setup_time: '5 minutes',
      features: []
    });
    
    // Create template tables and columns
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      
      const templateTable = await TemplateTable.create({
        name: table.name,
        description: table.description || '',
        template_id: template.id,
        order: i
      });
      
      // Create columns for this table
      for (let j = 0; j < table.columns.length; j++) {
        const column = table.columns[j];
        
        await TemplateColumn.create({
          name: column.name,
          key: column.key,
          data_type: column.data_type,
          is_required: column.is_required,
          is_unique: column.is_unique,
          default_value: column.default_value,
          description: column.description || '',
          config: column.config || {},
          template_table_id: templateTable.id,
          order: j
        });
      }
    }
    
    // Fetch the complete template with relations
    const completeTemplate = await TableTemplate.findByPk(template.id, {
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
    
    res.status(201).json({
      success: true,
      message: 'Template created successfully from database',
      data: completeTemplate
    });
  } catch (error) {
    next(error);
  }
};

// Get template categories
export const getTemplateCategories = async (req, res, next) => {
  try {
    const categories = await TemplateCategory.find({ isActive: true })
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// Create new category (Super Admin only)
export const createCategory = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { name, description, color } = req.body;
    
    // Check if category already exists
    const existingCategory = await TemplateCategory.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }
    
    const category = new TemplateCategory({
      name,
      description: description || '',
      color: color || '#1890ff',
      createdBy: String(req.user._id)
    });
    
    await category.save();
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// Update category (Super Admin only)
export const updateCategory = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { id } = req.params;
    const { name, description, color, isActive } = req.body;
    
    // Check if new name conflicts with existing category
    if (name) {
      const existingCategory = await TemplateCategory.findOne({ 
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name}$`, 'i') } 
      });
      
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category name already exists'
        });
      }
    }
    
    const category = await TemplateCategory.findByIdAndUpdate(
      id,
      { name, description, color, isActive },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// Delete category (Super Admin only)
export const deleteCategory = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { id } = req.params;
    
    // Check if category has templates
    const templateCount = await TableTemplate.count({ where: { category: id } });
    if (templateCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${templateCount} templates. Please move or delete templates first.`
      });
    }
    
    const category = await TemplateCategory.findByIdAndDelete(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ========== TEMPLATE TABLE MANAGEMENT ENDPOINTS ==========

// Get template table (Super Admin only)
export const getTemplateTable = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { templateId, tableIndex } = req.params;
    
    // Get template
    const template = await TableTemplate.findByPk(templateId, {
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
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    const tableIndexNum = parseInt(tableIndex);
    if (tableIndexNum < 0 || tableIndexNum >= template.tables.length) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    const table = template.tables[tableIndexNum];
    
    res.status(200).json({
      success: true,
      data: {
        template,
        table,
        tableIndex: tableIndexNum
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update template table (Super Admin only)
export const updateTemplateTable = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { templateId, tableIndex } = req.params;
    const { name, description } = req.body;
    
    // Get template with tables
    const template = await TableTemplate.findByPk(templateId, {
      include: [
        {
          model: TemplateTable,
          as: 'tables',
          order: [['order', 'ASC']]
        }
      ]
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    const tableIndexNum = parseInt(tableIndex);
    if (tableIndexNum < 0 || tableIndexNum >= template.tables.length) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    const table = template.tables[tableIndexNum];
    await table.update({ name, description });
    
    res.status(200).json({
      success: true,
      message: 'Table updated successfully',
      data: table
    });
  } catch (error) {
    next(error);
  }
};

// Add template column (Super Admin only)
export const addTemplateColumn = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { templateId, tableIndex } = req.params;
    const columnData = req.body;
    
    // Get template with tables
    const template = await TableTemplate.findByPk(templateId, {
      include: [
        {
          model: TemplateTable,
          as: 'tables',
          order: [['order', 'ASC']]
        }
      ]
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    const tableIndexNum = parseInt(tableIndex);
    if (tableIndexNum < 0 || tableIndexNum >= template.tables.length) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    const table = template.tables[tableIndexNum];
    
    // Get max order for new column
    const maxOrder = await TemplateColumn.max('order', {
      where: { template_table_id: table.id }
    });
    
    const newColumn = await TemplateColumn.create({
      ...columnData,
      template_table_id: table.id,
      order: (maxOrder || 0) + 1
    });
    
    res.status(201).json({
      success: true,
      message: 'Column added successfully',
      data: newColumn
    });
  } catch (error) {
    next(error);
  }
};

// Update template column (Super Admin only)
export const updateTemplateColumn = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { templateId, tableIndex, columnId } = req.params;
    const columnData = req.body;
    
    // Get template with tables
    const template = await TableTemplate.findByPk(templateId, {
      include: [
        {
          model: TemplateTable,
          as: 'tables',
          order: [['order', 'ASC']]
        }
      ]
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    const tableIndexNum = parseInt(tableIndex);
    if (tableIndexNum < 0 || tableIndexNum >= template.tables.length) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    const table = template.tables[tableIndexNum];
    
    // Find column
    const column = await TemplateColumn.findOne({
      where: {
        id: columnId,
        template_table_id: table.id
      }
    });
    
    if (!column) {
      return res.status(404).json({
        success: false,
        message: 'Column not found'
      });
    }
    
    await column.update(columnData);
    
    res.status(200).json({
      success: true,
      message: 'Column updated successfully',
      data: column
    });
  } catch (error) {
    next(error);
  }
};

// Delete template column (Super Admin only)
export const deleteTemplateColumn = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { templateId, tableIndex, columnId } = req.params;
    
    // Get template with tables
    const template = await TableTemplate.findByPk(templateId, {
      include: [
        {
          model: TemplateTable,
          as: 'tables',
          order: [['order', 'ASC']]
        }
      ]
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    const tableIndexNum = parseInt(tableIndex);
    if (tableIndexNum < 0 || tableIndexNum >= template.tables.length) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    const table = template.tables[tableIndexNum];
    
    // Find and delete column
    const column = await TemplateColumn.findOne({
      where: {
        id: columnId,
        template_table_id: table.id
      }
    });
    
    if (!column) {
      return res.status(404).json({
        success: false,
        message: 'Column not found'
      });
    }
    
    await column.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Column deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Reorder template columns (Super Admin only)
export const reorderTemplateColumns = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { templateId, tableIndex } = req.params;
    const { columnOrders } = req.body; // Array of { columnId, order }
    
    if (!columnOrders || !Array.isArray(columnOrders)) {
      return res.status(400).json({
        success: false,
        message: 'Column orders array is required'
      });
    }
    
    // Get template with tables
    const template = await TableTemplate.findByPk(templateId, {
      include: [
        {
          model: TemplateTable,
          as: 'tables',
          order: [['order', 'ASC']]
        }
      ]
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    const tableIndexNum = parseInt(tableIndex);
    if (tableIndexNum < 0 || tableIndexNum >= template.tables.length) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    const table = template.tables[tableIndexNum];
    
    // Update column orders
    for (const { columnId, order } of columnOrders) {
      await TemplateColumn.update(
        { order: order },
        {
          where: {
            id: columnId,
            template_table_id: table.id
          }
        }
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Columns reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Add template record
export const addTemplateRecord = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { templateId, tableIndex } = req.params;
    const recordData = req.body;
    
    // Get template table
    const template = await TableTemplate.findByPk(templateId, {
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
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    const tableIndexNum = parseInt(tableIndex);
    if (tableIndexNum < 0 || tableIndexNum >= template.tables.length) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    const table = template.tables[tableIndexNum];
    
    // Create record in database
    const newRecord = await TemplateRecord.create({
      template_id: templateId,
      table_index: tableIndexNum,
      data: recordData.data || recordData || {},
      created_by: String(req.user._id)
    });
    
    // Format and calculate formula
    const formattedRecord = {
      _id: newRecord.id,
      data: newRecord.data,
      created_at: newRecord.created_at,
      updated_at: newRecord.updated_at
    };
    
    const enhancedRecords = calculateFormulaColumnsForTemplate([formattedRecord], table.columns);
    
    res.status(201).json({
      success: true,
      message: 'Sample record added successfully',
      data: enhancedRecords[0]
    });
  } catch (error) {
    next(error);
  }
};

// Get template records
export const getTemplateRecords = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { templateId, tableIndex } = req.params;
    
    // Get template table
    const template = await TableTemplate.findByPk(templateId, {
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
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    const tableIndexNum = parseInt(tableIndex);
    if (tableIndexNum < 0 || tableIndexNum >= template.tables.length) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    const table = template.tables[tableIndexNum];
    
    // Get records from database
    const records = await TemplateRecord.findAll({
      where: {
        template_id: templateId,
        table_index: tableIndexNum
      },
      order: [['created_at', 'ASC']]
    });
    
    // Format records to match frontend expectations
    const formattedRecords = records.map(record => ({
      _id: record.id,
      data: record.data,
      created_at: record.created_at,
      updated_at: record.updated_at
    }));
    
    // Calculate formula columns for all records
    let enhancedRecords = calculateFormulaColumnsForTemplate(formattedRecords, table.columns);
    
    // Calculate lookup columns for all records
    enhancedRecords = await calculateLookupColumnsForTemplate(enhancedRecords, table.columns, templateId, tableIndexNum);
    
    res.status(200).json({
      success: true,
      data: enhancedRecords
    });
  } catch (error) {
    next(error);
  }
};

// Update template record
export const updateTemplateRecord = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { templateId, tableIndex, recordId } = req.params;
    const updateData = req.body;
    
    // Get template table
    const template = await TableTemplate.findByPk(templateId, {
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
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    const tableIndexNum = parseInt(tableIndex);
    if (tableIndexNum < 0 || tableIndexNum >= template.tables.length) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    const table = template.tables[tableIndexNum];
    
    // Update record in database
    const record = await TemplateRecord.findOne({
      where: {
        id: recordId,
        template_id: templateId,
        table_index: tableIndexNum
      }
    });
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }
    
    // Update the record data
    await record.update({
      data: { ...record.data, ...updateData }
    });
    
    // Format and calculate formula
    const formattedRecord = {
      _id: record.id,
      data: record.data,
      created_at: record.created_at,
      updated_at: record.updated_at
    };
    
    const enhancedRecords = calculateFormulaColumnsForTemplate([formattedRecord], table.columns);
    
    res.status(200).json({
      success: true,
      message: 'Record updated successfully',
      data: enhancedRecords[0]
    });
  } catch (error) {
    next(error);
  }
};

// Delete template record
export const deleteTemplateRecord = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { templateId, tableIndex, recordId } = req.params;
    
    // Get template table
    const template = await TableTemplate.findByPk(templateId, {
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
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    const tableIndexNum = parseInt(tableIndex);
    if (tableIndexNum < 0 || tableIndexNum >= template.tables.length) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    // Delete record from database
    const deletedCount = await TemplateRecord.destroy({
      where: {
        id: recordId,
        template_id: templateId,
        table_index: tableIndexNum
      }
    });
    
    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Bulk delete template records
export const deleteMultipleTemplateRecords = async (req, res, next) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }
    
    const { templateId, tableIndex } = req.params;
    const { recordIds } = req.body;
    
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Record IDs are required and must be an array'
      });
    }
    
    // Get template table
    const template = await TableTemplate.findByPk(templateId, {
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
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    const tableIndexNum = parseInt(tableIndex);
    if (tableIndexNum < 0 || tableIndexNum >= template.tables.length) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    // Delete multiple records from database
    const deletedCount = await TemplateRecord.destroy({
      where: {
        id: {
          [Op.in]: recordIds
        },
        template_id: templateId,
        table_index: tableIndexNum
      }
    });
    
    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No records found to delete'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `${deletedCount} record(s) deleted successfully`,
      data: {
        deletedCount,
      recordIds: recordIds
    }
  });
  } catch (error) {
    next(error);
  }
};

// Get linked table data for template columns
export const getTemplateLinkedTableData = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { search, limit = 50, page = 1 } = req.query;

    // Find the column in template
    const column = await TemplateColumn.findByPk(columnId);

    if (!column) {
      return res.status(404).json({ message: 'Template column not found' });
    }

    if (column.data_type !== 'linked_table') {
      return res.status(400).json({ message: 'Column is not a linked table type' });
    }

    if (!column.config || !column.config.linkedTableConfig || !column.config.linkedTableConfig.linkedTableId) {
      return res.status(400).json({ message: 'Linked table configuration not found' });
    }

    const linkedTableId = column.config.linkedTableConfig.linkedTableId;

    // Get the linked template table
    const linkedTable = await TemplateTable.findByPk(linkedTableId);

    if (!linkedTable) {
      return res.status(404).json({ message: 'Linked template table not found' });
    }

    // Get columns of the linked table
    const linkedTableColumns = await TemplateColumn.findAll({
      where: { template_table_id: linkedTableId },
      order: [['order', 'ASC']]
    });

    // TemplateRecord uses template_id + table_index, not template_table_id
    // We need to find the table_index for this table
    const allTablesInTemplate = await TemplateTable.findAll({
      where: { template_id: linkedTable.template_id },
      order: [['order', 'ASC']]
    });
    
    // Find the index of the linked table
    const tableIndex = allTablesInTemplate.findIndex(t => t.id === linkedTableId);
    
    if (tableIndex === -1) {
      return res.status(404).json({ message: 'Linked table index not found' });
    }

    // Get sample records from the linked table
    let whereClause = { 
      template_id: linkedTable.template_id,
      table_index: tableIndex
    };
    
    // Apply search filter if provided
    if (search) {
      // Search in the data JSONB field
      whereClause = {
        ...whereClause,
        data: {
          [Op.or]: linkedTableColumns.map(col => ({
            [col.name]: { [Op.iLike]: `%${search}%` }
          }))
        }
      };
    }

    // Get records with pagination
    const offset = (page - 1) * limit;
    const records = await TemplateRecord.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    const totalCount = await TemplateRecord.count({ 
      where: { 
        template_id: linkedTable.template_id,
        table_index: tableIndex
      } 
    });

    // Transform records to options format
    const options = records.map((record, index) => {
      let label = `Record ${index + 1}`;
      
      if (record.data && Object.keys(record.data).length > 0) {
        // Use displayColumnId from config if available
        const displayColumnId = column.config.linkedTableConfig?.displayColumnId;
        const displayColumn = linkedTableColumns.find(col => col.id === displayColumnId);
        
        if (displayColumn && record.data[displayColumn.name]) {
          label = String(record.data[displayColumn.name]);
        } else {
          // Get the first column that has data
          const firstColumn = linkedTableColumns[0];
          if (firstColumn && record.data[firstColumn.name]) {
            label = String(record.data[firstColumn.name]);
          } else {
            // Fallback to any available data
            const dataKeys = Object.keys(record.data);
            const firstDataKey = dataKeys.find(key => record.data[key] && String(record.data[key]).trim());
            if (firstDataKey) {
              label = String(record.data[firstDataKey]);
            }
          }
        }
      }
      
      return {
        value: record.id,
        label: String(label),
        recordId: record.id,
        data: record.data
      };
    });

    res.json({
      success: true,
      data: {
        options,
        totalCount,
        linkedTable: {
          _id: linkedTable.id,
          name: linkedTable.name,
          id: linkedTable.id
        },
        linkedTableColumns: linkedTableColumns.map(col => ({
          id: col.id,
          name: col.name,
          data_type: col.data_type,
          key: col.key
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching template linked table data:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get lookup data for template columns
export const getTemplateLookupData = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { search = '', page = 1, limit = 10 } = req.query;

    // Get the column
    const column = await TemplateColumn.findByPk(columnId);

    if (!column) {
      return res.status(404).json({ message: 'Template column not found' });
    }

    // Check if it's a lookup column
    if (column.data_type !== 'lookup') {
      return res.status(400).json({ message: 'Column is not a lookup type' });
    }

    const lookupConfig = column.config?.lookupConfig;
    if (!lookupConfig || !lookupConfig.linkedTableId || !lookupConfig.lookupColumnId) {
      return res.status(400).json({ message: 'Lookup configuration not found' });
    }

    // Get the linked template table
    const linkedTable = await TemplateTable.findByPk(lookupConfig.linkedTableId);
    if (!linkedTable) {
      return res.status(404).json({ message: 'Linked template table not found' });
    }

    // Get the lookup column
    const lookupColumn = await TemplateColumn.findByPk(lookupConfig.lookupColumnId);
    if (!lookupColumn) {
      return res.status(404).json({ message: 'Lookup column not found' });
    }

    // Get all tables in template to find table index
    const allTablesInTemplate = await TemplateTable.findAll({
      where: { template_id: linkedTable.template_id },
      order: [['order', 'ASC']]
    });
    
    const tableIndex = allTablesInTemplate.findIndex(t => t.id === lookupConfig.linkedTableId);
    
    if (tableIndex === -1) {
      return res.status(404).json({ message: 'Linked table index not found' });
    }

    // Build where clause for records
    let whereClause = { 
      template_id: linkedTable.template_id,
      table_index: tableIndex
    };
    
    // Apply search filter if provided
    if (search && search.trim()) {
      // Search in the specific lookup column
      whereClause = {
        ...whereClause,
        data: {
          [lookupColumn.name]: { [Op.iLike]: `%${search.trim()}%` }
        }
      };
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch records with pagination
    const records = await TemplateRecord.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Get total count
    const totalCount = await TemplateRecord.count({ 
      where: { 
        template_id: linkedTable.template_id,
        table_index: tableIndex
      } 
    });

    // Get columns of the linked table for display
    const linkedTableColumns = await TemplateColumn.findAll({
      where: { template_table_id: lookupConfig.linkedTableId },
      order: [['order', 'ASC']]
    });

    // Transform records into options
    const options = records.map((record, index) => {
      // Create a display label from the specific lookup column
      let label = `Record ${index + 1}`;
      
      // Try lookup column first
      const lookupValue = record.data?.[lookupColumn.name];
      if (lookupValue && String(lookupValue).trim()) {
        label = String(lookupValue);
      } else {
        // Fallback: use any available data
        const data = record.data || {};
        const dataKeys = Object.keys(data);
        const firstDataKey = dataKeys.find(key => data[key] && String(data[key]).trim());
        if (firstDataKey) {
          label = String(data[firstDataKey]);
        }
      }

      return {
        value: record.id,
        label: String(label),
        data: record.data
      };
    });

    res.json({
      success: true,
      data: {
        options,
        totalCount,
        linkedTable: {
          _id: linkedTable.id,
          name: linkedTable.name,
          id: linkedTable.id
        },
        lookupColumn: {
          id: lookupColumn.id,
          name: lookupColumn.name,
          data_type: lookupColumn.data_type
        },
        linkedTableColumns: linkedTableColumns.map(col => ({
          id: col.id,
          name: col.name,
          data_type: col.data_type,
          key: col.key
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching template lookup data:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
