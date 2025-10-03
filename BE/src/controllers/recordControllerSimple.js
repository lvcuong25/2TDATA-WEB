import { Table as PostgresTable, Column as PostgresColumn, Record as PostgresRecord, sequelize } from '../models/postgres/index.js';
import { Op } from 'sequelize';
import { updateMetabaseTable } from '../utils/metabaseTableCreator.js';
import Table from '../model/Table.js';
import Column from '../model/Column.js';
import { evaluateFormula } from '../utils/formulaEngine.js';

// Helper function to calculate formula columns for records
const calculateFormulaColumns = async (records, tableId) => {
  try {
    console.log(`🔍 Starting formula calculation for table ${tableId} with ${records.length} records`);
    
    // Get all columns for this table
    const columns = await PostgresColumn.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });
    
    const formulaColumns = columns.filter(col => col.data_type === 'formula' && col.formula_config);
    console.log(`📋 Found ${formulaColumns.length} formula columns:`, formulaColumns.map(col => col.name));
    
    if (formulaColumns.length === 0) {
      console.log('⚠️ No formula columns found, returning original records');
      return records; // No formula columns, return as is
    }
    
    // Transform columns to match expected format
    const transformedColumns = columns.map(column => ({
      id: column.id,
      name: column.name,
      key: column.key,
      dataType: column.data_type,
      order: column.order,
      formulaConfig: column.formula_config
    }));
    
    // Calculate formula values for each record
    const enhancedRecords = records.map(record => {
      const enhancedRecord = { ...record };
      
      // Calculate each formula column
      formulaColumns.forEach(formulaColumn => {
        try {
          const formulaValue = evaluateFormula(
            formulaColumn.formula_config.formula,
            enhancedRecord.data || {},
            transformedColumns
          );
          
          // Add calculated value to record data
          if (!enhancedRecord.data) enhancedRecord.data = {};
          const oldValue = enhancedRecord.data[formulaColumn.name];
          enhancedRecord.data[formulaColumn.name] = formulaValue;
          
          console.log(`🧮 Formula ${formulaColumn.name}: ${oldValue} → ${formulaValue}`);
          
        } catch (error) {
          console.error(`Error calculating formula for column ${formulaColumn.name}:`, error);
          // Set error value or null for failed calculations
          if (!enhancedRecord.data) enhancedRecord.data = {};
          enhancedRecord.data[formulaColumn.name] = null;
        }
      });
      
      return enhancedRecord;
    });
    
    return enhancedRecords;
    
  } catch (error) {
    console.error('Error calculating formula columns:', error);
    return records; // Return original records if calculation fails
  }
};

// Simple Record Controllers that use PostgreSQL
export const createRecordSimple = async (req, res) => {
  try {
    const { tableId, data } = req.body;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';
    const siteId = req.siteId?.toString() || '686d45a89a0a0c37366567c8';

    if (!tableId || !data) {
      return res.status(400).json({ message: 'Table ID and data are required' });
    }

    const table = await PostgresTable.findByPk(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found in PostgreSQL' });
    }

    // Create record in PostgreSQL
    const newRecord = await PostgresRecord.create({
      table_id: tableId,
      user_id: userId,
      site_id: siteId,
      data: data || {}
    });

    console.log(`✅ Record created in PostgreSQL: ${newRecord.id}`);

    // Update Metabase table
    try {
      const metabaseRecord = {
        id: newRecord.id,
        table_id: newRecord.table_id,
        user_id: newRecord.user_id,
        site_id: newRecord.site_id,
        data: newRecord.data,
        created_at: newRecord.created_at,
        updated_at: newRecord.updated_at
      };
      await updateMetabaseTable(tableId, metabaseRecord, 'insert', [], table.database_id);
      console.log(`✅ Metabase table updated for record: ${newRecord.id}`);
    } catch (metabaseError) {
      console.error('Metabase update failed:', metabaseError);
    }

    res.status(201).json({
      success: true,
      message: 'Record created successfully',
      data: {
        _id: newRecord.id,
        tableId: newRecord.table_id,
        userId: newRecord.user_id,
        siteId: newRecord.site_id,
        data: newRecord.data,
        createdAt: newRecord.created_at,
        updatedAt: newRecord.updated_at
      }
    });

  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getRecordsByTableIdSimple = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { page = 1, limit = 50, sortRules, filterRules } = req.query;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    console.log('🔍 Records request:', { tableId, sortRules, filterRules, page, limit });

    const table = await PostgresTable.findByPk(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const offset = (page - 1) * limit;

    // Build where clause for filtering
    let whereClause = { table_id: tableId };

    // Parse filter rules if provided
    if (filterRules) {
      try {
        const parsedFilters = JSON.parse(filterRules);
        // Add filter logic here if needed
        console.log('Filter rules:', parsedFilters);
      } catch (error) {
        console.error('Error parsing filter rules:', error);
      }
    }

    // Get columns to determine data types for sorting
    const columns = await PostgresColumn.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });

    // Build order clause for sorting
    let orderClause = [['created_at', 'ASC']];
    if (sortRules) {
      try {
        const parsedSorts = JSON.parse(sortRules);
        console.log('📊 Parsed sort rules:', parsedSorts);
        
        if (parsedSorts.length > 0) {
          const firstSort = parsedSorts[0];
          const sortField = firstSort.field;
          // Frontend sends 'order' instead of 'direction'
          const sortDirection = (firstSort.direction || firstSort.order || 'asc').toUpperCase();
          console.log('🔍 Debug sort direction:', { 
            original: firstSort.direction, 
            order: firstSort.order, 
            processed: sortDirection 
          });
          
          // Check if it's a data field (not system field)
          if (sortField !== 'created_at' && sortField !== 'updated_at' && sortField !== '_id') {
            // Find the column to determine data type
            const column = columns.find(col => col.name === sortField || col.key === sortField);
            
            if (column) {
              const dataType = column.data_type;
              console.log('🎯 Sorting by data field:', { field: sortField, dataType, direction: sortDirection });
              
              // Use appropriate JSONB sorting based on data type
              if (['number', 'currency', 'percent', 'rating'].includes(dataType)) {
                // Handle empty strings and invalid numeric values by using CASE statement
                // Empty strings will be sorted last (after valid numbers)
                orderClause = [[sequelize.literal(`
                  CASE 
                    WHEN data->>'${sortField}' = '' THEN 1
                    WHEN data->>'${sortField}' IS NULL THEN 1
                    ELSE 0
                  END
                `), 'ASC'], [sequelize.literal(`
                  CASE 
                    WHEN data->>'${sortField}' = '' OR data->>'${sortField}' IS NULL THEN NULL
                    ELSE (data->>'${sortField}')::numeric
                  END
                `), sortDirection]];
              } else if (['date', 'datetime', 'created_time', 'last_edited_time'].includes(dataType)) {
                // Handle empty strings and invalid date values
                orderClause = [[sequelize.literal(`
                  CASE 
                    WHEN data->>'${sortField}' = '' THEN 1
                    WHEN data->>'${sortField}' IS NULL THEN 1
                    ELSE 0
                  END
                `), 'ASC'], [sequelize.literal(`
                  CASE 
                    WHEN data->>'${sortField}' = '' OR data->>'${sortField}' IS NULL THEN NULL
                    ELSE (data->>'${sortField}')::timestamp
                  END
                `), sortDirection]];
              } else if (['time', 'year'].includes(dataType)) {
                // Handle time and year as numeric values
                orderClause = [[sequelize.literal(`
                  CASE 
                    WHEN data->>'${sortField}' = '' THEN 1
                    WHEN data->>'${sortField}' IS NULL THEN 1
                    ELSE 0
                  END
                `), 'ASC'], [sequelize.literal(`
                  CASE 
                    WHEN data->>'${sortField}' = '' OR data->>'${sortField}' IS NULL THEN NULL
                    ELSE (data->>'${sortField}')::numeric
                  END
                `), sortDirection]];
              } else {
                // For text and other types (text, long_text, single_select, multi_select, checkbox, url, email, phone, attachment, formula, rollup, lookup, linked_table)
                // Use unicode collation for proper alphabetical sorting
                // Empty strings will be sorted last
                orderClause = [[sequelize.literal(`
                  CASE 
                    WHEN data->>'${sortField}' = '' THEN 1
                    WHEN data->>'${sortField}' IS NULL THEN 1
                    ELSE 0
                  END
                `), 'ASC'], [sequelize.literal(`data->>'${sortField}' COLLATE "en_US.utf8"`), sortDirection]];
              }
            } else {
              // Fallback to text sorting if column not found
              orderClause = [[sequelize.literal(`data->>'${sortField}' COLLATE "en_US.utf8"`), sortDirection]];
            }
          } else {
            // System field sorting
            orderClause = [[sortField, sortDirection]];
          }
        }
      } catch (error) {
        console.error('Error parsing sort rules:', error);
      }
    }

    // Get records with pagination
    const { count, rows: records } = await PostgresRecord.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('📋 Query executed with order:', orderClause);
    console.log('📊 Records count:', count, 'Returned:', records.length);


    // Transform PostgreSQL data to match frontend expected format
    const transformedRecords = records.map(record => ({
      _id: record.id,
      tableId: record.table_id,
      userId: record.user_id,
      siteId: record.site_id,
      data: record.data,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));

    // Calculate formula columns for all records
    console.log(`🧮 Calculating formula columns for ${transformedRecords.length} records in table ${tableId}`);
    const enhancedRecords = await calculateFormulaColumns(transformedRecords, tableId);
    console.log(`✅ Formula calculation completed for ${enhancedRecords.length} records`);

    res.status(200).json({
      success: true,
      data: enhancedRecords,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getRecordByIdSimple = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    const record = await PostgresRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const table = await PostgresTable.findByPk(record.table_id);
    if (!table) {
      return res.status(404).json({ message: 'Associated table not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: record.id,
        tableId: record.table_id,
        userId: record.user_id,
        siteId: record.site_id,
        data: record.data,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateRecordSimple = async (req, res) => {
  try {
    const { recordId } = req.params;
    let { data } = req.body; // Change to let to allow reassignment
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    const record = await PostgresRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const table = await PostgresTable.findByPk(record.table_id);
    if (!table) {
      return res.status(404).json({ message: 'Associated table not found' });
    }

    // Validate data if provided - TEMPORARILY RELAXED FOR TESTING
    if (data !== undefined) {
      // Allow null data to pass through (frontend might send null)
      if (data === null) {
        data = {}; // Convert null to empty object
      } else if (typeof data !== 'object') {
        return res.status(400).json({ message: 'Data must be an object' });
      }

      // Get table columns for validation
      const columns = await PostgresColumn.findAll({
        where: { table_id: record.table_id },
        order: [['order', 'ASC']]
      });
      
      // Validate data against column definitions
      const validatedData = {};
      for (const column of columns) {
        const value = data[column.name];
        
        // Check required fields
        if (column.is_required && (value === undefined || value === null || value === '')) {
          return res.status(400).json({ 
            message: `Column '${column.name}' is required` 
          });
        }

        // Validate email format for email data type
        if (column.data_type === 'email' && value && value !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return res.status(400).json({ 
              message: `Invalid email format for column '${column.name}'` 
            });
          }
        }

        // Validate phone format for phone data type
        if (column.data_type === 'phone' && value && value !== '') {
          const phoneRegex = /^[\+]?[0-9][\d]{6,15}$/;
          const cleanPhone = value.replace(/[\s\-\(\)\.]/g, '');
          if (!phoneRegex.test(cleanPhone)) {
            return res.status(400).json({ 
              message: `Invalid phone number format for column '${column.name}'` 
            });
          }
        }

        // Validate number format for number data types - TEMPORARILY RELAXED FOR TESTING
        if (['number', 'currency', 'percent', 'rating'].includes(column.data_type) && value && value !== '') {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            // Instead of returning error, convert to 0 or skip validation
            console.log(`⚠️ Invalid number value for column '${column.name}': ${value}, skipping validation`);
            // Don't include this field in validatedData
            continue;
          }
        }

        // Validate date format for date data types
        if (['date', 'datetime'].includes(column.data_type) && value && value !== '') {
          const dateValue = new Date(value);
          if (isNaN(dateValue.getTime())) {
            return res.status(400).json({ 
              message: `Invalid date value for column '${column.name}'` 
            });
          }
        }

        // Only include fields that exist in column definitions
        if (value !== undefined) {
          validatedData[column.name] = value;
        }
      }

      // Check for fields that don't exist in column definitions - TEMPORARILY RELAXED FOR TESTING
      const columnNames = columns.map(col => col.name);
      for (const fieldName of Object.keys(data)) {
        if (!columnNames.includes(fieldName)) {
          console.log(`⚠️ Field '${fieldName}' does not exist in table columns, skipping...`);
          // Skip this field instead of returning error
          continue;
        }
      }

      await record.update({
        data: validatedData
      });
    } else {
      // No data provided, keep existing data
      await record.update({
        data: record.data
      });
    }

    console.log(`✅ Record updated in PostgreSQL: ${record.id}`);

    // Calculate formula columns for updated record and save back to database
    const enhancedRecords = await calculateFormulaColumns([record], record.table_id);
    const enhancedRecord = enhancedRecords[0];
    
    // Update record again with calculated formula values
    if (enhancedRecord.data !== record.data) {
      await record.update({
        data: enhancedRecord.data
      });
      console.log(`🧮 Formula values calculated and saved for record: ${record.id}`);
    }

    // Update Metabase table
    try {
      const metabaseRecord = {
        id: record.id,
        table_id: record.table_id,
        user_id: record.user_id,
        site_id: record.site_id,
        data: record.data,
        created_at: record.created_at,
        updated_at: record.updated_at
      };
      await updateMetabaseTable(record.table_id, metabaseRecord, 'update', [], table.database_id);
      console.log(`✅ Metabase table updated for record: ${record.id}`);
    } catch (metabaseError) {
      console.error('Metabase update failed:', metabaseError);
    }

    res.status(200).json({
      success: true,
      message: 'Record updated successfully',
      data: {
        _id: record.id,
        tableId: record.table_id,
        userId: record.user_id,
        siteId: record.site_id,
        data: record.data,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }
    });

  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteRecordSimple = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    const record = await PostgresRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const table = await PostgresTable.findByPk(record.table_id);
    if (!table) {
      return res.status(404).json({ message: 'Associated table not found' });
    }

    // Update Metabase table before deleting
    try {
      await updateMetabaseTable(record.table_id, { id: record.id }, 'delete', [], record.table_id);
      console.log(`✅ Metabase table updated for deleted record: ${record.id}`);
    } catch (metabaseError) {
      console.error('Metabase update failed:', metabaseError);
    }

    await record.destroy();

    console.log(`✅ Record deleted from PostgreSQL: ${record.id}`);

    res.status(200).json({
      success: true,
      message: 'Record deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getTableStructureSimple = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    if (!tableId) {
      return res.status(400).json({ message: "Table ID is required" });
    }

    // Get table from PostgreSQL
    const table = await PostgresTable.findByPk(tableId);
    
    if (!table) {
      // Fallback to MongoDB if not found in PostgreSQL
      const mongoTable = await Table.findOne({ name: 'PostgresX' }).populate('databaseId');
      
      if (!mongoTable) {
        return res.status(404).json({ message: 'Table not found in both PostgreSQL and MongoDB' });
      }
      
      // Get columns from MongoDB
      const columns = await Column.find({ tableId: mongoTable._id }).sort({ order: 1 });
      
      return res.status(200).json({
        success: true,
        data: {
          table: mongoTable,
          columns: columns
        }
      });
    }

    // Get columns from PostgreSQL
    const columns = await PostgresColumn.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });

    // Transform data to match frontend expected format
    const transformedTable = {
      _id: table.id,
      name: table.name,
      description: table.description,
      databaseId: table.database_id,
      userId: table.user_id,
      siteId: table.site_id,
      tableAccessRule: table.table_access_rule,
      columnAccessRules: table.column_access_rules,
      recordAccessRules: table.record_access_rules,
      cellAccessRules: table.cell_access_rules,
      createdAt: table.created_at,
      updatedAt: table.updated_at
    };

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
      data: {
        table: transformedTable,
        columns: transformedColumns
      }
    });

  } catch (error) {
    console.error('Error fetching table structure:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
