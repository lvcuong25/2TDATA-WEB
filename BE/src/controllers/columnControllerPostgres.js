import { Table, Column, Record, sequelize } from '../models/postgres/index.js';
import { Op } from 'sequelize';
import { hybridDbManager } from '../config/hybrid-db.js';
import Base from '../model/Base.js';
import BaseMember from '../model/BaseMember.js';
import { isSuperAdmin } from '../utils/permissionUtils.js';

// Column Controllers for PostgreSQL
export const createColumn = async (req, res) => {
  try {
    const { 
      tableId, 
      name, 
      dataType, 
      isRequired, 
      isUnique, 
      defaultValue,
      checkboxConfig,
      singleSelectConfig,
      multiSelectConfig,
      dateConfig,
      formulaConfig,
      currencyConfig,
      percentConfig,
      urlConfig,
      phoneConfig,
      timeConfig,
      ratingConfig,
      linkedTableConfig,
      lookupConfig
    } = req.body;
    const userId = req.user._id;
    const siteId = req.siteId;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Column name is required' });
    }

    if (!dataType) {
      return res.status(400).json({ message: 'Data type is required' });
    }

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    // Verify table exists in PostgreSQL
    const table = await Table.findByPk(tableId);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user is a member of the database and has permission
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: table.database_id, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }

      // Only owner and manager can create columns
      if (baseMember.role !== 'owner' && baseMember.role !== 'manager') {
        return res.status(403).json({ 
          message: 'Access denied - only database owners and managers can create columns' 
        });
      }
    }

    // Check if column name already exists in this table
    const existingColumn = await Column.findOne({
      where: {
        name: name.trim(),
        table_id: tableId
      }
    });

    if (existingColumn) {
      return res.status(400).json({ 
        message: 'Column name already exists in this table' 
      });
    }

    // Generate key from name
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Get the next order number
    const lastColumn = await Column.findOne({
      where: { table_id: tableId },
      order: [['order', 'DESC']]
    });
    const order = lastColumn ? lastColumn.order + 1 : 0;

    // Create column in PostgreSQL
    const newColumn = await Column.create({
      name: name.trim(),
      key: key,
      type: 'string', // Default type
      data_type: dataType,
      table_id: tableId,
      user_id: userId,
      site_id: siteId,
      is_required: isRequired || false,
      is_unique: isUnique || false,
      default_value: defaultValue,
      checkbox_config: checkboxConfig,
      single_select_config: singleSelectConfig,
      multi_select_config: multiSelectConfig,
      formula_config: formulaConfig,
      date_config: dateConfig,
      currency_config: currencyConfig,
      percent_config: percentConfig,
      url_config: urlConfig,
      phone_config: phoneConfig,
      time_config: timeConfig,
      rating_config: ratingConfig,
      linked_table_config: linkedTableConfig,
      lookup_config: lookupConfig,
      order: order
    });

    console.log(`✅ Column created in PostgreSQL: ${newColumn.name} (${newColumn.id})`);

    // If this is a formula column, calculate values for all existing records
    if (dataType === 'formula' && formulaConfig) {
      console.log(`🧮 New formula column created, calculating values for all records in table ${tableId}`);
      
      try {
        // Import formula calculation function
        const { evaluateFormula } = await import('../utils/formulaEngine.js');
        
        // Get all columns for this table
        const allColumns = await Column.findAll({
          where: { table_id: tableId },
          order: [['order', 'ASC']]
        });
        
        // Get all records for this table
        const records = await Record.findAll({
          where: { table_id: tableId }
        });
        
        console.log(`📊 Found ${records.length} records to calculate formula for`);
        
        // Transform columns for formula engine
        const transformedColumns = allColumns.map(col => ({
          id: col.id,
          name: col.name,
          key: col.key,
          dataType: col.data_type,
          order: col.order,
          formulaConfig: col.formula_config
        }));
        
        let updatedCount = 0;
        
        // Calculate formula for each record
        for (const record of records) {
          const updatedData = { ...record.data };
          let hasChanges = false;
          
          // Calculate formula for this new column
          try {
            const formulaValue = evaluateFormula(
              formulaConfig.formula,
              record.data || {},
              transformedColumns
            );
            
            if (updatedData[newColumn.name] !== formulaValue) {
              updatedData[newColumn.name] = formulaValue;
              hasChanges = true;
              console.log(`🧮 ${newColumn.name}: ${record.data?.[newColumn.name]} → ${formulaValue}`);
            }
          } catch (error) {
            console.error(`❌ Error calculating formula for ${newColumn.name}:`, error.message);
            updatedData[newColumn.name] = null;
            hasChanges = true;
          }
          
          // Update record if there are changes
          if (hasChanges) {
            await record.update({ data: updatedData });
            updatedCount++;
          }
        }
        
        console.log(`🎉 Calculated formula for ${updatedCount} records with new column`);
        
      } catch (error) {
        console.error('❌ Error calculating formula for new column:', error.message);
      }
    }

    res.status(201).json({
      message: 'Column created successfully',
      column: {
        _id: newColumn.id,
        name: newColumn.name,
        key: newColumn.key,
        type: newColumn.type,
        dataType: newColumn.data_type,
        tableId: newColumn.table_id,
        userId: newColumn.user_id,
        siteId: newColumn.site_id,
        isRequired: newColumn.is_required,
        isUnique: newColumn.is_unique,
        defaultValue: newColumn.default_value,
        checkboxConfig: newColumn.checkbox_config,
        singleSelectConfig: newColumn.single_select_config,
        multiSelectConfig: newColumn.multi_select_config,
        formulaConfig: newColumn.formula_config,
        dateConfig: newColumn.date_config,
        currencyConfig: newColumn.currency_config,
        percentConfig: newColumn.percent_config,
        urlConfig: newColumn.url_config,
        phoneConfig: newColumn.phone_config,
        timeConfig: newColumn.time_config,
        ratingConfig: newColumn.rating_config,
        linkedTableConfig: newColumn.linked_table_config,
        lookupConfig: newColumn.lookup_config,
        order: newColumn.order,
        createdAt: newColumn.created_at,
        updatedAt: newColumn.updated_at
      }
    });

  } catch (error) {
    console.error('Error creating column:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const getColumns = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user._id;

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    // Verify table exists
    const table = await Table.findByPk(tableId);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user has access to this table
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: table.database_id, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Get columns from PostgreSQL
    const columns = await Column.findAll({
      where: {
        table_id: tableId
      },
      order: [['order', 'ASC']]
    });

    // Transform to match frontend expected format
    const transformedColumns = columns.map(column => ({
      _id: column.id,
      name: column.name,
      key: column.key,
      type: column.type,
      dataType: column.data_type,
      tableId: column.table_id,
      userId: column.user_id,
      siteId: column.site_id,
      isRequired: column.is_required,
      isUnique: column.is_unique,
      defaultValue: column.default_value,
      checkboxConfig: column.checkbox_config,
      singleSelectConfig: column.single_select_config,
      multiSelectConfig: column.multi_select_config,
      formulaConfig: column.formula_config,
      dateConfig: column.date_config,
      currencyConfig: column.currency_config,
      percentConfig: column.percent_config,
      urlConfig: column.url_config,
      phoneConfig: column.phone_config,
      timeConfig: column.time_config,
      ratingConfig: column.rating_config,
      linkedTableConfig: column.linked_table_config,
      lookupConfig: column.lookup_config,
      order: column.order,
      createdAt: column.created_at,
      updatedAt: column.updated_at
    }));

    res.json({
      message: 'Columns retrieved successfully',
      columns: transformedColumns
    });

  } catch (error) {
    console.error('Error getting columns:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const updateColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    const updateData = req.body;
    const userId = req.user._id;

    // Get column from PostgreSQL
    const column = await Column.findByPk(columnId);

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Get table to check permissions
    const table = await Table.findByPk(column.table_id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user has permission to update this column
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: table.database_id, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Only owner and manager can update columns
      if (baseMember.role !== 'owner' && baseMember.role !== 'manager') {
        return res.status(403).json({ 
          message: 'Access denied - only database owners and managers can update columns' 
        });
      }
    }

    // Check if new name conflicts with existing columns
    if (updateData.name && updateData.name.trim() !== column.name) {
      const existingColumn = await Column.findOne({
        where: {
          name: updateData.name.trim(),
          table_id: column.table_id,
          id: { [require('sequelize').Op.ne]: columnId }
        }
      });

      if (existingColumn) {
        return res.status(400).json({ 
          message: 'Column name already exists in this table' 
        });
      }
    }

    // Update column
    const allowedFields = [
      'name', 'dataType', 'isRequired', 'isUnique', 'defaultValue',
      'checkboxConfig', 'singleSelectConfig', 'multiSelectConfig',
      'formulaConfig', 'dateConfig', 'currencyConfig', 'percentConfig',
      'urlConfig', 'phoneConfig', 'timeConfig', 'ratingConfig',
      'linkedTableConfig', 'lookupConfig', 'order'
    ];

    const updateFields = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field === 'dataType') {
          updateFields.data_type = updateData[field];
        } else if (field === 'isRequired') {
          updateFields.is_required = updateData[field];
        } else if (field === 'isUnique') {
          updateFields.is_unique = updateData[field];
        } else if (field === 'defaultValue') {
          updateFields.default_value = updateData[field];
        } else if (field.endsWith('Config')) {
          updateFields[field.replace(/([A-Z])/g, '_$1').toLowerCase()] = updateData[field];
        } else {
          updateFields[field] = updateData[field];
        }
      }
    }

    // Update key if name changed
    if (updateData.name) {
      updateFields.key = updateData.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    await column.update(updateFields);

    console.log(`✅ Column updated in PostgreSQL: ${column.name} (${column.id})`);

    // If this is a formula column and formula config changed, recalculate all records
    if (updateData.dataType === 'formula' && updateData.formulaConfig) {
      console.log(`🧮 Formula column updated, recalculating all records for table ${column.table_id}`);
      
      try {
        // Import formula calculation function
        const { evaluateFormula } = await import('../utils/formulaEngine.js');
        
        // Get all columns for this table
        const allColumns = await Column.findAll({
          where: { table_id: column.table_id },
          order: [['order', 'ASC']]
        });
        
        // Get all records for this table
        const records = await Record.findAll({
          where: { table_id: column.table_id }
        });
        
        console.log(`📊 Found ${records.length} records to recalculate`);
        
        // Transform columns for formula engine
        const transformedColumns = allColumns.map(col => ({
          id: col.id,
          name: col.name,
          key: col.key,
          dataType: col.data_type,
          order: col.order,
          formulaConfig: col.formula_config
        }));
        
        let updatedCount = 0;
        
        // Recalculate each record
        for (const record of records) {
          const updatedData = { ...record.data };
          let hasChanges = false;
          
          // Calculate formula for this column
          try {
            const formulaValue = evaluateFormula(
              updateData.formulaConfig.formula,
              record.data || {},
              transformedColumns
            );
            
            if (updatedData[column.name] !== formulaValue) {
              updatedData[column.name] = formulaValue;
              hasChanges = true;
              console.log(`🧮 ${column.name}: ${record.data?.[column.name]} → ${formulaValue}`);
            }
          } catch (error) {
            console.error(`❌ Error calculating formula for ${column.name}:`, error.message);
            updatedData[column.name] = null;
            hasChanges = true;
          }
          
          // Update record if there are changes
          if (hasChanges) {
            await record.update({ data: updatedData });
            updatedCount++;
          }
        }
        
        console.log(`🎉 Recalculated ${updatedCount} records with new formula`);
        
      } catch (error) {
        console.error('❌ Error recalculating formula records:', error.message);
      }
    }

    res.json({
      message: 'Column updated successfully',
      column: {
        _id: column.id,
        name: column.name,
        key: column.key,
        type: column.type,
        dataType: column.data_type,
        tableId: column.table_id,
        userId: column.user_id,
        siteId: column.site_id,
        isRequired: column.is_required,
        isUnique: column.is_unique,
        defaultValue: column.default_value,
        checkboxConfig: column.checkbox_config,
        singleSelectConfig: column.single_select_config,
        multiSelectConfig: column.multi_select_config,
        formulaConfig: column.formula_config,
        dateConfig: column.date_config,
        currencyConfig: column.currency_config,
        percentConfig: column.percent_config,
        urlConfig: column.url_config,
        phoneConfig: column.phone_config,
        timeConfig: column.time_config,
        ratingConfig: column.rating_config,
        linkedTableConfig: column.linked_table_config,
        lookupConfig: column.lookup_config,
        order: column.order,
        createdAt: column.created_at,
        updatedAt: column.updated_at
      }
    });

  } catch (error) {
    console.error('Error updating column:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const deleteColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    const userId = req.user._id;

    // Get column from PostgreSQL
    const column = await Column.findByPk(columnId);

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Get table to check permissions
    const table = await Table.findByPk(column.table_id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user has permission to delete this column
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: table.database_id, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Only owner can delete columns
      if (baseMember.role !== 'owner') {
        return res.status(403).json({ 
          message: 'Access denied - only database owners can delete columns' 
        });
      }
    }

    // Delete column
    await column.destroy();

    console.log(`✅ Column deleted from PostgreSQL: ${column.name} (${columnId})`);

    res.json({
      message: 'Column deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting column:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const createColumnAtPosition = async (req, res) => {
  try {
    const { tableId, position, referenceColumnId } = req.params;
    const { name, dataType, isRequired, isUnique, defaultValue } = req.body;
    const userId = req.user._id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Column name is required' });
    }

    if (!dataType) {
      return res.status(400).json({ message: 'Data type is required' });
    }

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    if (!position || !['left', 'right'].includes(position)) {
      return res.status(400).json({ message: 'Position must be "left" or "right"' });
    }

    if (!referenceColumnId) {
      return res.status(400).json({ message: 'Reference column ID is required' });
    }

    // Verify table exists
    const table = await Table.findByPk(tableId);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user has access to this table
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: table.database_id, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }
    }

    // Get reference column to determine order
    const referenceColumn = await Column.findByPk(referenceColumnId);
    if (!referenceColumn) {
      return res.status(404).json({ message: 'Reference column not found' });
    }

    // Calculate new order
    let newOrder;
    if (position === 'left') {
      // Insert to the left of reference column
      newOrder = referenceColumn.order;
    } else {
      // Insert to the right of reference column
      newOrder = referenceColumn.order + 1;
    }

    // Update order of existing columns that need to be shifted
    // All columns with order >= newOrder need to be shifted right by 1
    await Column.update(
      { order: sequelize.literal('"order" + 1') },
      { 
        where: { 
          table_id: tableId,
          order: { [Op.gte]: newOrder }
        }
      }
    );

    // Create new column
    const newColumn = await Column.create({
      name: name.trim(),
      key: name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_'),
      data_type: dataType,
      is_required: isRequired || false,
      is_unique: isUnique || false,
      default_value: defaultValue || null,
      order: newOrder,
      table_id: tableId,
      user_id: userId.toString(), // Convert ObjectId to string
      site_id: table.site_id
    });

    res.status(201).json({
      success: true,
      message: 'Column created successfully',
      data: {
        id: newColumn.id,
        name: newColumn.name,
        key: newColumn.key,
        dataType: newColumn.data_type,
        isRequired: newColumn.is_required,
        isUnique: newColumn.is_unique,
        defaultValue: newColumn.default_value,
        order: newColumn.order,
        tableId: newColumn.table_id,
        userId: newColumn.user_id,
        siteId: newColumn.site_id,
        createdAt: newColumn.created_at,
        updatedAt: newColumn.updated_at
      }
    });

  } catch (error) {
    console.error('Error creating column at position:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getColumnById = async (req, res) => {
  try {
    const { columnId } = req.params;
    const userId = req.user._id;
    const siteId = req.siteId;

    const column = await Column.findByPk(columnId);

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Check if user has access to this column's table
    if (!isSuperAdmin(req.user)) {
      const table = await Table.findByPk(column.table_id);
      if (!table) {
        return res.status(404).json({ message: 'Table not found' });
      }

      const baseMember = await BaseMember.findOne({
        databaseId: table.database_id,
        userId
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }
    }

    // Transform to match expected format
    const transformedColumn = {
      id: column.id,
      name: column.name,
      key: column.key,
      type: column.type,
      dataType: column.data_type,
      isRequired: column.is_required,
      isUnique: column.is_unique,
      defaultValue: column.default_value,
      order: column.order,
      tableId: column.table_id,
      userId: column.user_id,
      siteId: column.site_id,
      createdAt: column.created_at,
      updatedAt: column.updated_at
    };

    res.status(200).json({
      success: true,
      data: transformedColumn
    });
  } catch (error) {
    console.error('Error fetching column:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getLinkedTableData = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { search, limit = 50, page = 1 } = req.query;
    const userId = req.user._id;
    const siteId = req.siteId;

    // Find the column
    const column = await Column.findByPk(columnId);

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    if (column.data_type !== 'linked_table') {
      return res.status(400).json({ message: 'Column is not a linked table type' });
    }

    if (!column.linked_table_config || !column.linked_table_config.linkedTableId) {
      return res.status(400).json({ message: 'Linked table configuration not found' });
    }

    const linkedTableId = column.linked_table_config.linkedTableId;

    // Build query for records
    let whereClause = { table_id: linkedTableId };
    
    if (search) {
      // For linked table, we'll search in the data JSONB field
      whereClause = {
        ...whereClause,
        data: sequelize.where(
          sequelize.fn('jsonb_to_text', sequelize.col('data')),
          'ILIKE',
          `%${search}%`
        )
      };
    }

    // Get records from PostgreSQL
    const offset = (page - 1) * limit;
    const records = await Record.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    const totalCount = await Record.count({ where: whereClause });

    res.json({
      success: true,
      data: {
        records: records.map(record => ({
          id: record.id,
          data: record.data,
          createdAt: record.created_at,
          updatedAt: record.updated_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching linked table data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getLookupData = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { search, limit = 50, page = 1 } = req.query;
    const userId = req.user._id;
    const siteId = req.siteId;

    // Find the column
    const column = await Column.findByPk(columnId);

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    if (column.data_type !== 'lookup') {
      return res.status(400).json({ message: 'Column is not a lookup type' });
    }

    if (!column.lookup_config || !column.lookup_config.linkedTableId) {
      return res.status(400).json({ message: 'Lookup configuration not found' });
    }

    const linkedTableId = column.lookup_config.linkedTableId;
    const displayField = column.lookup_config.displayField || 'name';

    // Build query for records
    let whereClause = { table_id: linkedTableId };
    
    if (search) {
      // Search in the specific display field
      whereClause = {
        ...whereClause,
        [`data.${displayField}`]: {
          [sequelize.Op.iLike]: `%${search}%`
        }
      };
    }

    // Get records from PostgreSQL
    const offset = (page - 1) * limit;
    const records = await Record.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    const totalCount = await Record.count({ where: whereClause });

    res.json({
      success: true,
      data: {
        records: records.map(record => ({
          id: record.id,
          data: record.data,
          createdAt: record.created_at,
          updatedAt: record.updated_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching lookup data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const reorderColumns = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { columnOrders } = req.body; // Array of { columnId, order }
    const userId = req.user._id;

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    if (!columnOrders || !Array.isArray(columnOrders)) {
      return res.status(400).json({ message: 'Column orders array is required' });
    }

    // Verify table exists
    const table = await Table.findByPk(tableId);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user is a member of the database
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({
        databaseId: table.database_id,
        userId
      });

      if (!baseMember) {
        return res.status(403).json({ 
          message: "Access denied - you are not a member of this database" 
        });
      }

      // Check if user has permission to reorder columns
      if (baseMember.role === 'member') {
        return res.status(403).json({ 
          message: "Access denied - only owners and managers can reorder columns" 
        });
      }
    }

    // Update column orders in PostgreSQL
    for (const { columnId, order } of columnOrders) {
      await Column.update(
        { order: order },
        { where: { id: columnId, table_id: tableId } }
      );
    }

    res.json({
      success: true,
      message: 'Columns reordered successfully'
    });

  } catch (error) {
    console.error('Error reordering columns:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};
