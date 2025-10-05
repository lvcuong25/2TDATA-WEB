import { Table, Column, Record, sequelize } from '../models/postgres/index.js';
import { Op } from 'sequelize';
import { hybridDbManager } from '../config/hybrid-db.js';
import Base from '../model/Base.js';
import BaseMember from '../model/BaseMember.js';
import { isSuperAdmin } from '../utils/permissionUtils.js';

// Helper function to convert value to date type
const convertValueToDateType = (value, dataType) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const stringValue = String(value).trim();
  
  // Try to parse date, including Excel serial numbers
  let dateValue;
  const numValue = parseFloat(stringValue);
  
  // Check if it's an Excel serial number (range: 25569-100000)
  if (!isNaN(numValue) && numValue > 25569 && numValue < 100000) {
    // Convert Excel serial number to date
    // Excel serial number 25569 = 1970-01-01
    // Excel epoch is 1900-01-01, but we need to account for the leap year bug
    const excelEpoch = new Date(1900, 0, 1);
    dateValue = new Date(excelEpoch.getTime() + (numValue - 2) * 24 * 60 * 60 * 1000);
    
    console.log(`📅 Converting Excel serial ${numValue} to date: ${dateValue.toISOString()}`);
  } else {
    // Try to parse as regular date string
    dateValue = new Date(stringValue);
  }
  
  if (isNaN(dateValue.getTime())) {
    console.log(`❌ Could not parse date: ${stringValue}`);
    return stringValue; // Return original if can't parse
  }
  
  if (dataType === 'year') {
    const year = dateValue.getFullYear();
    console.log(`📅 Converting to year: ${year}`);
    return year;
  } else if (dataType === 'datetime') {
    const isoString = dateValue.toISOString();
    console.log(`📅 Converting to datetime: ${isoString}`);
    return isoString;
  } else {
    const dateOnly = dateValue.toISOString().split('T')[0];
    console.log(`📅 Converting to date: ${dateOnly}`);
    return dateOnly; // Date only
  }
};

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
        const exprEvalEngine = (await import('../utils/exprEvalEngine.js')).default;
        
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
            const formulaValue = exprEvalEngine.evaluateFormula(
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

    // If column name was changed, update all records FIRST before changing column metadata
    if (updateData.name && updateData.name.trim() !== column.name) {
      const oldColumnName = column.name;
      const newColumnName = updateData.name.trim();
      
      console.log(`📝 Updating records: renaming column key from "${oldColumnName}" to "${newColumnName}"`);
      
      // Find all records that have data for the old column name
      const records = await Record.findAll({
        where: { 
          table_id: column.table_id,
          data: sequelize.where(
            sequelize.fn('json_extract_path_text', sequelize.col('data'), oldColumnName),
            sequelize.Op.ne, null
          )
        }
      });
      
      let updatedCount = 0;
      for (const record of records) {
        if (record.data && record.data[oldColumnName] !== undefined) {
          const oldValue = record.data[oldColumnName];
          
          // Create new data object
          const newData = { ...record.data };
          delete newData[oldColumnName];
          newData[newColumnName] = oldValue;
          
          await record.update({ data: newData });
          updatedCount++;
        }
      }
      
      console.log(`✅ Successfully renamed column key in ${updatedCount} records from "${oldColumnName}" to "${newColumnName}"`);
    }

    // If column data type was changed, validate and convert existing data
    if (updateData.data_type && updateData.data_type !== column.data_type) {
      const oldDataType = column.data_type;
      const newDataType = updateData.data_type;
      
      console.log(`📝 Updating records: changing column type from "${oldDataType}" to "${newDataType}"`);
      
      // Find all records that have data for this column
      const records = await Record.findAll({
        where: { table_id: column.table_id }
      });
      
      let convertedCount = 0;
      let invalidCount = 0;
      
      for (const record of records) {
        if (record.data && record.data[column.name] !== undefined) {
          const value = record.data[column.name];
          
          if (value === '' || value === null || value === undefined) {
            // Empty values are OK
            continue;
          }
          
          let newValue = value;
          let isValid = true;
          
          // Convert data based on new type
          switch (newDataType) {
            case 'number':
            case 'currency':
            case 'percent':
            case 'rating':
              const numValue = Number(value);
              if (isNaN(numValue)) {
                console.log(`   ⚠️ Invalid number value: "${value}" in record ${record.id}`);
                invalidCount++;
                isValid = false;
              } else {
                newValue = numValue;
              }
              break;
              
            case 'date':
            case 'datetime':
              // Try to parse date
              const dateValue = new Date(value);
              if (isNaN(dateValue.getTime())) {
                console.log(`   ⚠️ Invalid date value: "${value}" in record ${record.id}`);
                invalidCount++;
                isValid = false;
              } else {
                newValue = dateValue.toISOString();
              }
              break;
              
            case 'checkbox':
              // Convert to boolean
              if (typeof value === 'string') {
                newValue = value.toLowerCase() === 'true' || value === '1';
              } else {
                newValue = Boolean(value);
              }
              break;
              
            case 'formula':
              // For formula columns, we need to calculate the value
              // This is a simplified example - in real implementation, you'd use a formula engine
              if (updateData.formula_config && updateData.formula_config.formula) {
                // Simple formula evaluation (you'd replace this with a proper formula engine)
                newValue = 'Calculated Value'; // Placeholder
              }
              break;
              
            default:
              // For text and other types, keep as string
              newValue = String(value);
          }
          
          if (isValid) {
            const newData = { ...record.data };
            newData[column.name] = newValue;
            await record.update({ data: newData });
            convertedCount++;
          }
        }
      }
      
      console.log(`✅ Converted ${convertedCount} values to new type`);
      if (invalidCount > 0) {
        console.log(`   ⚠️ ${invalidCount} values could not be converted to new type`);
      }
    }

    await column.update(updateFields);

    console.log(`✅ Column updated in PostgreSQL: ${column.name} (${column.id})`);

    // If this is a formula column and formula config changed, recalculate all records
    if (updateData.dataType === 'formula' && updateData.formulaConfig) {
      console.log(`🧮 Formula column updated, recalculating all records for table ${column.table_id}`);
      
      try {
        // Import formula calculation function
        const exprEvalEngine = (await import('../utils/exprEvalEngine.js')).default;
        
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
            const formulaValue = exprEvalEngine.evaluateFormula(
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


    // Update Metabase table structure
    try {
      const { createMetabaseTable } = await import('../utils/metabaseTableCreator.js');
      await createMetabaseTable(column.table_id, table.name, null, table.database_id);
      console.log(`✅ Metabase table structure updated for column: ${column.name}`);
    } catch (metabaseError) {
      console.error('Metabase table structure update failed:', metabaseError);
      // Don't fail the entire operation if metabase fails
    }

    // If data type changed to date/datetime/year, convert existing data
    if (updateData.dataType && ['date', 'datetime', 'year'].includes(updateData.dataType) && 
        column.data_type !== updateData.dataType) {
      console.log(`📅 Data type changed to ${updateData.dataType}, converting existing data for column ${column.name}`);
      
      try {
        // Get all records for this table
        const records = await Record.findAll({
          where: { table_id: column.table_id }
        });
        
        console.log(`📊 Found ${records.length} records to convert`);
        
        let updatedCount = 0;
        
        // Convert each record
        for (const record of records) {
          const updatedData = { ...record.data };
          const currentValue = record.data?.[column.name];
          
          if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
            let convertedValue = convertValueToDateType(currentValue, updateData.dataType);
            
            if (convertedValue !== currentValue) {
              updatedData[column.name] = convertedValue;
              await record.update({ data: updatedData });
              updatedCount++;
              console.log(`📅 ${column.name}: ${currentValue} → ${convertedValue}`);
            }
          }
        }
        
        console.log(`🎉 Converted ${updatedCount} records to ${updateData.dataType} format`);
        
      } catch (error) {
        console.error('❌ Error converting date records:', error.message);
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

    const columnName = column.name;
    const tableId = column.table_id;

    // Remove the column data from all records in this table first
    console.log(`📝 Removing column data from all records: "${columnName}"`);
    
    const records = await Record.findAll({
      where: { table_id: tableId }
    });
    
    let updatedCount = 0;
    for (const record of records) {
      if (record.data && record.data[columnName] !== undefined) {
        const newData = { ...record.data };
        delete newData[columnName];
        
        await record.update({ data: newData });
        updatedCount++;
      }
    }
    
    console.log(`✅ Successfully removed column data from ${updatedCount} records`);

    // Delete column
    await column.destroy();

    console.log(`✅ Column deleted from PostgreSQL: ${columnName} (${columnId})`);

    // Update Metabase table structure
    try {
      const { createMetabaseTable } = await import('../utils/metabaseTableCreator.js');
      await createMetabaseTable(tableId, table.name, null, table.database_id);
      console.log(`✅ Metabase table structure updated after deleting column: ${columnName}`);
    } catch (metabaseError) {
      console.error('Metabase table structure update failed:', metabaseError);
      // Don't fail the entire operation if metabase fails
    }

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

    console.log(`✅ Column created in PostgreSQL: ${newColumn.name} (${newColumn.data_type})`);

    // Update Metabase table structure with new column
    try {
      const { createMetabaseTable } = await import('../utils/metabaseTableCreator.js');
      await createMetabaseTable(newColumn.table_id, table.name, null, table.database_id);
      console.log(`✅ Metabase table structure updated with new column: ${newColumn.name}`);
    } catch (metabaseError) {
      console.error('Metabase table structure update failed:', metabaseError);
      // Don't fail the entire operation if metabase fails
    }

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

    // Get linked table info
    const linkedTable = await Table.findByPk(linkedTableId);

    // Get columns of the linked table
    const linkedTableColumns = await Column.findAll({
      where: { table_id: linkedTableId },
      order: [['order', 'ASC']]
    });

    // Transform records to options format
    const options = records.map((record, index) => {
      // Try to get the display column value as label
      let label = `Record ${index + 1}`;
      if (record.data && Object.keys(record.data).length > 0) {
        // Use displayColumnId from config if available
        const displayColumnId = column.linked_table_config?.displayColumnId;
        if (displayColumnId && record.data[displayColumnId]) {
          label = String(record.data[displayColumnId]);
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
        linkedTable: linkedTable ? {
          _id: linkedTable.id,
          name: linkedTable.name
        } : null,
        linkedTableColumns: linkedTableColumns.map(col => ({
          _id: col.id,
          name: col.name,
          dataType: col.data_type,
          order: col.order
        }))
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
    const { search = '', page = 1, limit = 10 } = req.query;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';
    const siteId = req.siteId?.toString() || '686d45a89a0a0c37366567c8';

    // console.log('🔍 getLookupData called:', { columnId, search, page, limit });

    // Get the column
    const column = await Column.findByPk(columnId);

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Check if it's a lookup column
    if (column.data_type !== 'lookup') {
      return res.status(400).json({ message: 'Column is not a lookup type' });
    }

    const lookupConfig = column.lookup_config;
    if (!lookupConfig || !lookupConfig.linkedTableId || !lookupConfig.lookupColumnId) {
      return res.status(400).json({ message: 'Lookup configuration not found' });
    }

    // console.log('🔍 Lookup config:', lookupConfig);

    // Get the linked table
    const linkedTable = await Table.findByPk(lookupConfig.linkedTableId);
    if (!linkedTable) {
      return res.status(404).json({ message: 'Linked table not found' });
    }

    // Get the lookup column
    const lookupColumn = await Column.findByPk(lookupConfig.lookupColumnId);
    if (!lookupColumn) {
      return res.status(404).json({ message: 'Lookup column not found' });
    }

    // console.log('🔍 Linked table:', linkedTable.name);
    // console.log('🔍 Lookup column:', lookupColumn.name);

    // Build search query - search in all text fields
    let whereClause = { table_id: lookupConfig.linkedTableId };
    
    if (search && search.trim()) {
      // Search in the specific lookup column
      whereClause[`data.${lookupColumn.name}`] = {
        [Op.iLike]: `%${search.trim()}%`
      };
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch records with pagination
    const records = await Record.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Get total count
    const totalCount = await Record.count({ where: whereClause });

    // Get columns of the linked table for display
    const linkedTableColumns = await Column.findAll({
      where: { table_id: lookupConfig.linkedTableId },
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
        // Fallback: create meaningful label
        const data = record.data || {};
        const priorityFields = ["Tên giao dịch", "Loại giao dịch", "chiến dịch", "Text 1"];
        
        for (const field of priorityFields) {
          if (data[field] && String(data[field]).trim()) {
            label = `${field}: ${String(data[field])}`;
            break;
          }
        }
      }

      return {
        value: record.id,
        label: String(label),
        data: record.data
      };
    });

    // console.log('🔍 Lookup data result:', {
    //   totalCount,
    //   optionsCount: options.length,
    //   linkedTable: linkedTable.name,
    //   linkedTableColumns: linkedTableColumns.length
    // });

    res.json({
      success: true,
      data: {
        options,
        totalCount,
        linkedTable: {
          _id: linkedTable.id,
          name: linkedTable.name
        },
        linkedTableColumns: linkedTableColumns.map(col => ({
          _id: col.id,
          name: col.name,
          dataType: col.data_type,
          order: col.order
        }))
      }
    });

  } catch (error) {
    console.error('Error getting lookup data:', error);
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
