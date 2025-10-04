import { Table as PostgresTable, Column as PostgresColumn, Record as PostgresRecord } from '../models/postgres/index.js';
import { createMetabaseTable } from '../utils/metabaseTableCreator.js';
import { Op } from 'sequelize';

// Simple Column Controllers that use PostgreSQL
export const createColumnSimple = async (req, res) => {
  try {
    const {
      tableId, name, dataType, isRequired, isUnique, defaultValue,
      checkboxConfig, singleSelectConfig, multiSelectConfig, formulaConfig,
      dateConfig, currencyConfig, percentConfig, urlConfig, phoneConfig,
      timeConfig, ratingConfig, linkedTableConfig, lookupConfig
    } = req.body;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';
    const siteId = req.siteId?.toString() || '686d45a89a0a0c37366567c8';

    if (!tableId || !name || name.trim() === '' || !dataType) {
      return res.status(400).json({ message: 'Table ID, name, and dataType are required' });
    }

    const table = await PostgresTable.findByPk(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found in PostgreSQL' });
    }

    // Generate a unique key for the column
    let key = name.trim().toLowerCase().replace(/\s+/g, '_');
    let keyExists = await PostgresColumn.findOne({ where: { table_id: tableId, key } });
    let counter = 1;
    while (keyExists) {
      key = `${name.trim().toLowerCase().replace(/\s+/g, '_')}_${counter}`;
      keyExists = await PostgresColumn.findOne({ where: { table_id: tableId, key } });
      counter++;
    }

    // Check if column name already exists for this table_id
    const existingColumn = await PostgresColumn.findOne({
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

    // Determine the 'order' for the new column
    const lastColumn = await PostgresColumn.findOne({
      where: { table_id: tableId },
      order: [['order', 'DESC']]
    });
    const order = lastColumn ? lastColumn.order + 1 : 0;

    // Map frontend dataType to backend type
    const mapDataTypeToColumnType = (dataType) => {
      switch (dataType) {
        case 'number':
        case 'year':
        case 'currency':
        case 'percent':
        case 'rating':
          return 'number';
        case 'date':
        case 'datetime':
        case 'time':
          return 'date';
        case 'checkbox':
          return 'boolean';
        case 'multi_select':
        case 'json':
        case 'linked_table':
        case 'lookup':
          return 'json';
        default:
          return 'string';
      }
    };

    // Create column in PostgreSQL
    const newColumn = await PostgresColumn.create({
      name: name.trim(),
      key: key,
      type: mapDataTypeToColumnType(dataType),
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

    console.log(`✅ Column created in PostgreSQL: ${newColumn.name} (${newColumn.data_type})`);


    // Update Metabase table structure with new column

    // Add default value to existing records for the new column
    const { Record } = await import('../models/postgres/index.js');
    const existingRecords = await Record.findAll({
      where: { table_id: tableId }
    });

    console.log(`📝 Adding default value to ${existingRecords.length} existing records`);

    for (const record of existingRecords) {
      const updatedData = { ...record.data };
      
      // Add default value for the new column if it doesn't exist
      if (updatedData[newColumn.name] === undefined) {
        if (defaultValue !== null && defaultValue !== undefined) {
          updatedData[newColumn.name] = defaultValue;
        } else {
          // Set appropriate default based on data type
          switch (dataType) {
            case 'number':
              updatedData[newColumn.name] = 0;
              break;
            case 'currency':
              // Use defaultValue from currencyConfig if available
              const currencyDefaultValue = currencyConfig?.defaultValue !== null && currencyConfig?.defaultValue !== undefined 
                ? currencyConfig.defaultValue 
                : 0;
              updatedData[newColumn.name] = currencyDefaultValue;
              break;
            case 'percent':
              // Use defaultValue from percentConfig if available
              const percentDefaultValue = percentConfig?.defaultValue !== null && percentConfig?.defaultValue !== undefined 
                ? percentConfig.defaultValue 
                : 0;
              updatedData[newColumn.name] = percentDefaultValue;
              break;
            case 'rating':
              // Use defaultValue from ratingConfig if available
              const ratingDefaultValue = ratingConfig?.defaultValue !== null && ratingConfig?.defaultValue !== undefined 
                ? ratingConfig.defaultValue 
                : 0;
              updatedData[newColumn.name] = ratingDefaultValue;
              break;
            case 'checkbox':
              // Use defaultValue from checkboxConfig if available
              const checkboxDefaultValue = checkboxConfig?.defaultValue !== null && checkboxConfig?.defaultValue !== undefined 
                ? checkboxConfig.defaultValue 
                : false;
              updatedData[newColumn.name] = checkboxDefaultValue;
              break;
            case 'date':
            case 'time':
              updatedData[newColumn.name] = null;
              break;
            case 'multi_select':
            case 'linked_table':
            case 'lookup':
              updatedData[newColumn.name] = [];
              break;
            default:
              updatedData[newColumn.name] = '';
          }
        }
        
        await record.update({ data: updatedData });
        console.log(`✅ Added default value to record ${record.id}`);
      }
    }

    // Recreate Metabase table with new column

    try {
      // Get database ID from table to determine schema
      const databaseId = table.database_id;
      
      const metabaseResult = await createMetabaseTable(tableId, table.name, 'column-added', databaseId);
      if (metabaseResult.success) {
        console.log(`✅ Metabase table updated with new column: ${newColumn.name}`);
      } else {
        console.error('Metabase table update failed:', metabaseResult.error);
      }
    } catch (metabaseError) {
      console.error('Metabase update failed:', metabaseError);
    }

    res.status(201).json({
      success: true,
      message: 'Column created successfully',
      data: {
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
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getColumnsByTableIdSimple = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    const table = await PostgresTable.findByPk(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const columns = await PostgresColumn.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });

    // Transform PostgreSQL data to match frontend expected format
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

    res.status(200).json({
      success: true,
      data: transformedColumns
    });

  } catch (error) {
    console.error('Error fetching columns:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateColumnSimple = async (req, res) => {
  try {
    console.log('🔍 updateColumnSimple called with columnId:', req.params.columnId);
    console.log('🔍 updateColumnSimple req.body:', req.body);
    const { columnId } = req.params;
    const {
      name, dataType, isRequired, isUnique, defaultValue, order,
      checkboxConfig, singleSelectConfig, multiSelectConfig, formulaConfig,
      dateConfig, currencyConfig, percentConfig, urlConfig, phoneConfig,
      timeConfig, ratingConfig, linkedTableConfig, lookupConfig
    } = req.body;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    const column = await PostgresColumn.findByPk(columnId);
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    const table = await PostgresTable.findByPk(column.table_id);
    if (!table) {
      return res.status(404).json({ message: 'Associated table not found' });
    }

    // Check for duplicate name if name is being updated
    if (name && name.trim() !== column.name) {
      const existingColumn = await PostgresColumn.findOne({
        where: {
          name: name.trim(),
          table_id: column.table_id,
          id: { [Op.ne]: columnId }
        }
      });

      if (existingColumn) {
        return res.status(400).json({ message: 'Column name already exists in this table' });
      }
    }

    // Map frontend dataType to backend type
    const mapDataTypeToColumnType = (dataType) => {
      switch (dataType) {
        case 'number':
        case 'year':
        case 'currency':
        case 'percent':
        case 'rating':
          return 'number';
        case 'date':
        case 'datetime':
        case 'time':
          return 'date';
        case 'checkbox':
          return 'boolean';
        case 'multi_select':
        case 'json':
        case 'linked_table':
        case 'lookup':
          return 'json';
        default:
          return 'string';
      }
    };

    const updateData = {
      name: name ? name.trim() : column.name,
      data_type: dataType || column.data_type,
      is_required: isRequired !== undefined ? isRequired : column.is_required,
      is_unique: isUnique !== undefined ? isUnique : column.is_unique,
      default_value: defaultValue !== undefined ? defaultValue : column.default_value,
      order: order !== undefined ? order : column.order,
      checkbox_config: checkboxConfig !== undefined ? checkboxConfig : column.checkbox_config,
      single_select_config: singleSelectConfig !== undefined ? singleSelectConfig : column.single_select_config,
      multi_select_config: multiSelectConfig !== undefined ? multiSelectConfig : column.multi_select_config,
      formula_config: formulaConfig !== undefined ? formulaConfig : column.formula_config,
      date_config: dateConfig !== undefined ? dateConfig : column.date_config,
      currency_config: currencyConfig !== undefined ? currencyConfig : column.currency_config,
      percent_config: percentConfig !== undefined ? percentConfig : column.percent_config,
      url_config: urlConfig !== undefined ? urlConfig : column.url_config,
      phone_config: phoneConfig !== undefined ? phoneConfig : column.phone_config,
      time_config: timeConfig !== undefined ? timeConfig : column.time_config,
      rating_config: ratingConfig !== undefined ? ratingConfig : column.rating_config,
      linked_table_config: linkedTableConfig !== undefined ? linkedTableConfig : column.linked_table_config,
      lookup_config: lookupConfig !== undefined ? lookupConfig : column.lookup_config,
    };

    // Update the 'type' based on the new 'data_type' if it changed
    if (dataType && dataType !== column.data_type) {
      updateData.type = mapDataTypeToColumnType(dataType);
    }

    // If column name was changed, update all records FIRST before changing column metadata
    if (name && name.trim() !== column.name) {
      const oldColumnName = column.name;
      const newColumnName = name.trim();
      
      console.log(`📝 Updating records: renaming column key from "${oldColumnName}" to "${newColumnName}"`);
      
      // Find all records that have data for the old column name
      const records = await PostgresRecord.findAll({
        where: { table_id: column.table_id }
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
    if (dataType && dataType !== column.data_type) {
      const oldDataType = column.data_type;
      const newDataType = dataType;
      
      console.log(`📝 Updating records: changing column type from "${oldDataType}" to "${newDataType}"`);
      
      // Find all records that have data for this column
      const records = await PostgresRecord.findAll({
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
              if (formulaConfig && formulaConfig.formula) {
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

    await column.update(updateData);

    console.log(`✅ Column updated in PostgreSQL: ${column.name} (${column.id})`);


    // Update Metabase table structure
    try {
      const { createMetabaseTable } = await import('../utils/metabaseTableCreator.js');
      await createMetabaseTable(column.table_id, table.name, null, table.database_id);
      console.log(`✅ Metabase table structure updated for column: ${column.name}`);
    } catch (metabaseError) {
      console.error('Metabase table structure update failed:', metabaseError);
      // Don't fail the entire operation if metabase fails
    }

    // If default value changed, update existing records that have empty/null values
    if (defaultValue !== undefined && defaultValue !== column.default_value) {
      const { Record } = await import('../models/postgres/index.js');
      const records = await Record.findAll({
        where: { table_id: column.table_id }
      });

      console.log(`🔄 Updating default values for ${records.length} records`);

      for (const record of records) {
        const updatedData = { ...record.data };
        
        // Update records that have empty, null, or 0 values for this column
        if (updatedData[column.name] === undefined || 
            updatedData[column.name] === null || 
            updatedData[column.name] === '' ||
            updatedData[column.name] === 0) {
          
          updatedData[column.name] = defaultValue;
          await record.update({ data: updatedData });
          console.log(`✅ Updated default value for record ${record.id}: ${column.name} = ${defaultValue}`);
        }
      }
    }

    // If percent config default value changed, update existing records
    if (percentConfig?.defaultValue !== undefined && 
        percentConfig?.defaultValue !== column.percent_config?.defaultValue) {
      const { Record } = await import('../models/postgres/index.js');
      const records = await Record.findAll({
        where: { table_id: column.table_id }
      });

      console.log(`🔄 Updating percent default values for ${records.length} records`);

      for (const record of records) {
        const updatedData = { ...record.data };
        
        // Update records that have empty, null, or 0 values for this column
        if (updatedData[column.name] === undefined || 
            updatedData[column.name] === null || 
            updatedData[column.name] === '' ||
            updatedData[column.name] === 0) {
          
          updatedData[column.name] = percentConfig.defaultValue;
          await record.update({ data: updatedData });
          console.log(`✅ Updated percent default value for record ${record.id}: ${column.name} = ${percentConfig.defaultValue}`);
        }
      }

    }

    res.status(200).json({
      success: true,
      message: 'Column updated successfully',
      data: {
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
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteColumnSimple = async (req, res) => {
  try {
    console.log('🔍 deleteColumnSimple called with columnId:', req.params.columnId);
    const { columnId } = req.params;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    const column = await PostgresColumn.findByPk(columnId);
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    const table = await PostgresTable.findByPk(column.table_id);
    if (!table) {
      return res.status(404).json({ message: 'Associated table not found' });
    }


    const columnName = column.name;
    const tableId = column.table_id;

    // Remove the column data from all records in this table first
    console.log(`📝 Removing column data from all records: "${columnName}"`);
    
    const records = await PostgresRecord.findAll({
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


    // Import Record model for data cleanup
    const { Record } = await import('../models/postgres/index.js');

    // Remove column data from all records in this table
    const records = await Record.findAll({
      where: { table_id: column.table_id }
    });

    console.log(`🗑️ Removing column data from ${records.length} records`);

    for (const record of records) {
      const updatedData = { ...record.data };
      if (updatedData[column.name] !== undefined) {
        delete updatedData[column.name];
        await record.update({ data: updatedData });
        console.log(`✅ Removed column data from record ${record.id}`);
      }
    }

    // Delete the column

    await column.destroy();

    console.log(`✅ Column deleted from PostgreSQL: ${columnName} (${column.id})`);

    // Update Metabase table structure
    try {
      const { createMetabaseTable } = await import('../utils/metabaseTableCreator.js');
      await createMetabaseTable(tableId, table.name, null, table.database_id);
      console.log(`✅ Metabase table structure updated after deleting column: ${columnName}`);
    } catch (metabaseError) {
      console.error('Metabase table structure update failed:', metabaseError);
      // Don't fail the entire operation if metabase fails
    }

    // Recreate Metabase table without the deleted column
    try {
      const metabaseResult = await createMetabaseTable(column.table_id, table.name, 'column-deleted');
      if (metabaseResult.success) {
        console.log(`✅ Metabase table recreated without column: ${column.name}`);
      } else {
        console.error('Metabase table recreation failed:', metabaseResult.error);
      }
    } catch (metabaseError) {
      console.error('Metabase update failed:', metabaseError);
    }

    res.status(200).json({
      success: true,
      message: 'Column deleted successfully',
      data: {
        deletedColumnName: column.name,
        recordsUpdated: records.length
      }
    });

  } catch (error) {
    console.error('Error deleting column:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
