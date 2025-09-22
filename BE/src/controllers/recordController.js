import Record from '../model/Record.js';
import Table from '../model/Table.js';
import Column from '../model/Column.js';
import Database from '../model/Database.js';
import FilterPreference from '../model/FilterPreference.js';
import exprEvalEngine from '../utils/exprEvalEngine.js';


// Helper function to calculate formula columns for records
const calculateFormulaColumns = async (records, tableId) => {
  try {
    // Get all columns for this table
    const columns = await Column.find({ tableId });
    const formulaColumns = columns.filter(col => col.dataType === 'formula' && col.formulaConfig);
    
    if (formulaColumns.length === 0) {
      return records; // No formula columns, return as is
    }
    
    // Calculate formula values for each record
    const enhancedRecords = records.map(record => {
      const enhancedRecord = record.toObject ? record.toObject() : record;
      
      // Calculate each formula column
      formulaColumns.forEach(formulaColumn => {
        try {
          const formulaValue = exprEvalEngine.evaluateFormula(
            formulaColumn.formulaConfig.formula,
            enhancedRecord.data || {},
            columns
          );
          
          // Add calculated value to record data
          if (!enhancedRecord.data) enhancedRecord.data = {};
          enhancedRecord.data[formulaColumn.name] = formulaValue;
          
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


// Calculate lookup column values
const calculateLookupColumns = async (records, tableId) => {
  try {
    // Get all columns for this table
    const columns = await Column.find({ tableId });
    const lookupColumns = columns.filter(col => col.dataType === 'lookup' && col.lookupConfig);
    
    if (lookupColumns.length === 0) {
      return records; // No lookup columns, return as is
    }
    
    // Calculate lookup values for each record
    const enhancedRecords = await Promise.all(records.map(async record => {
      const enhancedRecord = record.toObject ? record.toObject() : record;
      
      // Calculate each lookup column
      for (const lookupColumn of lookupColumns) {
        try {
          const { lookupConfig } = lookupColumn;
          
          // Find the linked_table column that this lookup depends on
          const linkedColumn = columns.find(col => 
            col.dataType === 'linked_table' && 
            col.linkedTableConfig?.linkedTableId?.toString() === lookupConfig.linkedTableId?.toString()
          );
          
          if (!linkedColumn) {
            console.warn(`No linked table column found for lookup ${lookupColumn.name}`);
            continue;
          }
          
          // Get the linked record ID from the linked_table column
          const linkedTableValue = enhancedRecord.data?.[linkedColumn.name];
          if (!linkedTableValue || !linkedTableValue.recordId) {
            continue; // No linked record
          }
          
          // Get the linked record
          const linkedRecord = await Record.findById(linkedTableValue.recordId);
          if (!linkedRecord) {
            continue;
          }
          
          // Get the lookup column from the linked table
          const lookupColumnInLinkedTable = await Column.findById(lookupConfig.lookupColumnId);
          if (!lookupColumnInLinkedTable) {
            continue;
          }
          
          // Extract the value from the linked record
          const lookupValue = linkedRecord.data?.[lookupColumnInLinkedTable.name];
          
          // Create proper lookup display value
          let displayValue = null;
          if (lookupValue && String(lookupValue).trim()) {
            displayValue = {
              value: linkedRecord._id,
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
          // Set null for failed calculations
          if (!enhancedRecord.data) enhancedRecord.data = {};
          enhancedRecord.data[lookupColumn.name] = null;
        }
      }
      
      return enhancedRecord;
    }));
    
    return enhancedRecords;
    
  } catch (error) {
    console.error('Error calculating lookup columns:', error);
    return records; // Return original records if calculation fails
  }
};

// Record Controllers
export const createRecord = async (req, res) => {
  try {
    const { tableId, data } = req.body;
    const userId = req.user._id;
    const siteId = req.siteId;

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ message: 'Data is required and must be an object' });
    }

    // Verify table exists and belongs to user
    const table = await Table.findOne({
      _id: tableId,
      userId,
      siteId
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Get table columns for validation
    const columns = await Column.find({ tableId }).sort({ order: 1 });
    
    // Validate data against column definitions
    const validatedData = {};
    for (const column of columns) {
      const value = data[column.name];
      
      // Check required fields
      if (column.isRequired && (value === undefined || value === null || value === '')) {
        return res.status(400).json({ 
          message: `Column '${column.name}' is required` 
        });
      }

      // Validate email format for email data type
      if (column.dataType === 'email' && value && value !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return res.status(400).json({ 
            message: `Invalid email format for column '${column.name}'` 
          });
        }
      }

      // Validate phone format for phone data type
      if (column.dataType === 'phone' && value && value !== '') {
        // Phone number validation - supports various formats including Vietnamese numbers
        const phoneRegex = /^[\+]?[0-9][\d]{6,15}$/;
        const cleanPhone = value.replace(/[\s\-\(\)\.]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
          return res.status(400).json({ 
            message: `Invalid phone number format for column '${column.name}'. Phone number should be 7-16 digits and can start with 0 or +` 
          });
        }
      }

      // Validate time format for time data type
      if (column.dataType === 'time' && value && value !== '') {
        // Time validation - supports both 12h and 24h format based on column config
        const format = column.timeConfig?.format || '24';
        
        if (format === '24') {
          // 24-hour format: HH:MM (00:00 to 23:59)
          const time24Regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!time24Regex.test(value)) {
            return res.status(400).json({ 
              message: `Invalid time format for column '${column.name}'. Time must be in 24-hour format (e.g., 14:30)` 
            });
          }
        } else {
          // 12-hour format: H:MM AM/PM (1:00 AM to 12:59 PM)
          const time12Regex = /^(1[0-2]|[1-9]):[0-5][0-9]\s?(AM|PM)$/i;
          if (!time12Regex.test(value)) {
            return res.status(400).json({ 
              message: `Invalid time format for column '${column.name}'. Time must be in 12-hour format (e.g., 2:30 PM)` 
            });
          }
        }
      }

      // Validate rating format for rating data type
      if (column.dataType === 'rating' && value !== undefined && value !== null) {
        // Rating validation - always supports half ratings
        const maxStars = column.ratingConfig?.maxStars || 5;
        const allowHalf = true; // Always allow half stars
        
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return res.status(400).json({ 
            message: `Invalid rating format for column '${column.name}'. Rating must be a number` 
          });
        }
        
        if (numValue < 0) {
          return res.status(400).json({ 
            message: `Invalid rating for column '${column.name}'. Rating cannot be negative` 
          });
        }
        
        if (numValue > maxStars) {
          return res.status(400).json({ 
            message: `Invalid rating for column '${column.name}'. Rating cannot exceed ${maxStars} stars` 
          });
        }
        
        if (!allowHalf && numValue % 1 !== 0) {
          return res.status(400).json({ 
            message: `Invalid rating for column '${column.name}'. Half stars are not allowed` 
          });
        }
      }

      // Validate URL format for url data type
      if (column.dataType === 'url' && value && value !== '') {
        let urlToValidate = value;
        
        // Auto-add protocol
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          if (column.urlConfig && column.urlConfig.protocol && column.urlConfig.protocol !== 'none') {
            const protocol = column.urlConfig.protocol;
            urlToValidate = `${protocol}://${value}`;
          } else if (column.urlConfig && column.urlConfig.protocol === 'none') {
            // Don't add protocol, keep original value
            urlToValidate = value;
          } else if (!column.urlConfig) {
            // Fallback for old columns without urlConfig
            urlToValidate = `https://${value}`;
          }
        }
        
        // Only validate URL format if protocol is not 'none'
        if (!(column.urlConfig && column.urlConfig.protocol === 'none')) {
          try {
            new URL(urlToValidate);
          } catch {
            return res.status(400).json({ 
              message: `Invalid URL format for column '${column.name}'` 
            });
          }
        }
      }

      // Validate percent format for percent data type
      if (column.dataType === 'percent') {
        if (value !== undefined && value !== null && value !== '') {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            return res.status(400).json({ 
              message: `Invalid percent value for column '${column.name}'. Must be a number.` 
            });
          }
          
          // Convert to decimal if needed (e.g., 50 -> 0.5 for 50%)
          if (column.percentConfig && column.percentConfig.displayFormat === 'percentage') {
            // If value is > 1, assume it's already in percentage format (50 for 50%)
            // If value is <= 1, assume it's in decimal format (0.5 for 50%)
            validatedData[column.name] = numValue > 1 ? numValue / 100 : numValue;
          } else {
            validatedData[column.name] = numValue;
          }
        } else {
          // Use default value if no value provided
          const defaultValue = column.percentConfig?.defaultValue || 0;
          validatedData[column.name] = defaultValue;
        }
      }

      // Check unique constraints
      if (column.isUnique && value !== undefined && value !== null && value !== '') {
        const existingRecord = await Record.findOne({
          tableId,
          [`data.${column.name}`]: value
        });

        if (existingRecord) {
          return res.status(400).json({ 
            message: `Value '${value}' already exists in unique column '${column.name}'` 
          });
        }
      }

      // Set default value if not provided
      if (value === undefined || value === null) {
        if (column.defaultValue !== null) {
          validatedData[column.name] = column.defaultValue;
        }
      } else {
        validatedData[column.name] = value;
      }
    }

    const record = new Record({
      tableId,
      databaseId: table.databaseId,
      userId,
      siteId,
      data: validatedData
    });

    await record.save();

    res.status(201).json({
      success: true,
      message: 'Record created successfully',
      data: record
    });
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



export const getRecords = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { page = 1, limit = 50, sortRules, forceAscending, filterRules } = req.query;
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user._id;
    const siteId = req.siteId;

    // Verify table exists and belongs to user
    const table = await Table.findOne({
      _id: tableId,
      userId,
      siteId
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const skip = (page - 1) * limit;
    
    // Parse sort rules from query string
    let parsedSortRules = [];
    if (sortRules) {
      try {
        parsedSortRules = JSON.parse(sortRules);
      } catch (error) {
        console.error('Error parsing sort rules:', error);
        parsedSortRules = [];
      }
    }

    // Parse filter rules from query string
    let parsedFilterRules = [];
    if (filterRules) {
      try {
        parsedFilterRules = JSON.parse(filterRules);
      } catch (error) {
        console.error('Error parsing filter rules:', error);
        parsedFilterRules = [];
      }
    }

    // If no filter rules in query, get from saved preferences
    if (parsedFilterRules.length === 0) {
      const filterPreference = await FilterPreference.findOne({
        tableId,
        userId,
        siteId
      });
      
      if (filterPreference && filterPreference.isActive && filterPreference.filterRules.length > 0) {
        parsedFilterRules = filterPreference.filterRules;
      }
    }

    // Build sort options
    let sortOptions = {};
    if (parsedSortRules.length > 0) {
      // Apply multiple sort rules
      for (const rule of parsedSortRules) {
        if (rule.field && rule.order) {
          // For data fields, we need to sort by the nested field
          if (rule.field !== 'createdAt' && rule.field !== 'updatedAt' && rule.field !== '_id') {
            sortOptions[`data.${rule.field}`] = rule.order === 'desc' ? -1 : 1;
          } else {
            sortOptions[rule.field] = rule.order === 'desc' ? -1 : 1;
          }
        }
      }
    } else {
      // Default sorting by creation time (oldest first, newest last)
      if (forceAscending === 'true') {
        sortOptions = { createdAt: 1 }; // Ascending: oldest first, newest last
      } else {
        sortOptions = { createdAt: -1 }; // Descending: newest first, oldest last
      }
    }

    // Build filter query
    let filterQuery = { tableId };
    
    if (parsedFilterRules.length > 0) {
      const filterConditions = [];
      
      for (const rule of parsedFilterRules) {
        const fieldPath = `data.${rule.field}`;
        let condition = {};
        
        switch (rule.operator) {
          case 'equals':
            condition[fieldPath] = rule.value;
            break;
          case 'not_equals':
            condition[fieldPath] = { $ne: rule.value };
            break;
          case 'contains':
            condition[fieldPath] = { $regex: rule.value, $options: 'i' };
            break;
          case 'not_contains':
            condition[fieldPath] = { $not: { $regex: rule.value, $options: 'i' } };
            break;
          case 'starts_with':
            condition[fieldPath] = { $regex: `^${rule.value}`, $options: 'i' };
            break;
          case 'ends_with':
            condition[fieldPath] = { $regex: `${rule.value}$`, $options: 'i' };
            break;
          case 'greater_than':
            condition[fieldPath] = { $gt: rule.value };
            break;
          case 'less_than':
            condition[fieldPath] = { $lt: rule.value };
            break;
          case 'greater_than_or_equal':
            condition[fieldPath] = { $gte: rule.value };
            break;
          case 'less_than_or_equal':
            condition[fieldPath] = { $lte: rule.value };
            break;
          case 'is_empty':
            condition[fieldPath] = { $in: ['', null, undefined] };
            break;
          case 'is_not_empty':
            condition[fieldPath] = { $nin: ['', null, undefined] };
            break;
          case 'is_null':
            condition[fieldPath] = null;
            break;
          case 'is_not_null':
            condition[fieldPath] = { $ne: null };
            break;
          default:
            continue;
        }
        
        filterConditions.push(condition);
      }
      
      if (filterConditions.length > 0) {
        filterQuery.$and = filterConditions;
      }
    }

    const records = await Record.find(filterQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalRecords = await Record.countDocuments(filterQuery);

    // Calculate formula and lookup columns
    const formulaEnhanced = await calculateFormulaColumns(records, tableId);
    const enhancedRecords = await calculateLookupColumns(formulaEnhanced, tableId);

    res.status(200).json({
      success: true,
      data: enhancedRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRecords,
        pages: Math.ceil(totalRecords / limit)
      },
      sortRules: parsedSortRules,
      filterRules: parsedFilterRules
    });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRecordById = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user._id;
    const siteId = req.siteId;

    const record = await Record.findOne({
      _id: recordId,
      userId,
      siteId
    });

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Calculate formula and lookup columns for single record
    const formulaEnhanced = await calculateFormulaColumns([record], tableId);
    const enhancedRecord = await calculateLookupColumns(formulaEnhanced, tableId);
    const finalRecord = enhancedRecord[0] || record;

    res.status(200).json({
      success: true,
      data: finalRecord
    });
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { data } = req.body;
    const userId = req.user._id;
    const siteId = req.siteId;

    console.log('Backend: updateRecord called:', {
      recordId,
      data,
      userId,
      siteId
    });

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ message: 'Data is required and must be an object' });
    }

    const record = await Record.findOne({
      _id: recordId,
      userId,
      siteId
    });

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Get table columns for validation
    const columns = await Column.find({ tableId: record.tableId }).sort({ order: 1 });
    
    // Validate data against column definitions
    const validatedData = { ...record.data };
    for (const column of columns) {
      const value = data[column.name];
      
      if (value !== undefined) {
        // Validate email format for email data type
        if (column.dataType === 'email' && value && value !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return res.status(400).json({ 
              message: `Invalid email format for column '${column.name}'` 
            });
          }
        }

        // Validate phone format for phone data type
        if (column.dataType === 'phone' && value && value !== '') {
          // Phone number validation - supports various formats including Vietnamese numbers
          const phoneRegex = /^[\+]?[0-9][\d]{6,15}$/;
          const cleanPhone = value.replace(/[\s\-\(\)\.]/g, '');
          if (!phoneRegex.test(cleanPhone)) {
            return res.status(400).json({ 
              message: `Invalid phone number format for column '${column.name}'. Phone number should be 7-16 digits and can start with 0 or +` 
            });
          }
        }

        // Validate time format for time data type
        if (column.dataType === 'time' && value && value !== '') {
          // Time validation - supports both 12h and 24h format based on column config
          const format = column.timeConfig?.format || '24';
          
          if (format === '24') {
            // 24-hour format: HH:MM (00:00 to 23:59)
            const time24Regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!time24Regex.test(value)) {
              return res.status(400).json({ 
                message: `Invalid time format for column '${column.name}'. Time must be in 24-hour format (e.g., 14:30)` 
              });
            }
          } else {
            // 12-hour format: H:MM AM/PM (1:00 AM to 12:59 PM)
            const time12Regex = /^(1[0-2]|[1-9]):[0-5][0-9]\s?(AM|PM)$/i;
            if (!time12Regex.test(value)) {
              return res.status(400).json({ 
                message: `Invalid time format for column '${column.name}'. Time must be in 12-hour format (e.g., 2:30 PM)` 
              });
            }
          }
        }

        // Validate rating format for rating data type
        if (column.dataType === 'rating' && value !== undefined && value !== null) {
          // Rating validation - always supports half ratings
          const maxStars = column.ratingConfig?.maxStars || 5;
          const allowHalf = true; // Always allow half stars
          
          const numValue = Number(value);
          if (isNaN(numValue)) {
            return res.status(400).json({ 
              message: `Invalid rating format for column '${column.name}'. Rating must be a number` 
            });
          }
          
          if (numValue < 0) {
            return res.status(400).json({ 
              message: `Invalid rating for column '${column.name}'. Rating cannot be negative` 
            });
          }
          
          if (numValue > maxStars) {
            return res.status(400).json({ 
              message: `Invalid rating for column '${column.name}'. Rating cannot exceed ${maxStars} stars` 
            });
          }
          
          if (!allowHalf && numValue % 1 !== 0) {
            return res.status(400).json({ 
              message: `Invalid rating for column '${column.name}'. Half stars are not allowed` 
            });
          }
        }

        // Validate URL format for url data type
        if (column.dataType === 'url' && value && value !== '') {
          let urlToValidate = value;
          
          console.log('Backend: URL validation:', {
            columnName: column.name,
            value,
            urlConfig: column.urlConfig,
            hasUrlConfig: !!column.urlConfig,
            protocol: column.urlConfig?.protocol
          });
          
          // Auto-add protocol
          if (!value.startsWith('http://') && !value.startsWith('https://')) {
            if (column.urlConfig && column.urlConfig.protocol && column.urlConfig.protocol !== 'none') {
              const protocol = column.urlConfig.protocol;
              urlToValidate = `${protocol}://${value}`;
            } else if (column.urlConfig && column.urlConfig.protocol === 'none') {
              // Don't add protocol, keep original value
              urlToValidate = value;
            } else if (!column.urlConfig) {
              // Fallback for old columns without urlConfig
              urlToValidate = `https://${value}`;
            }
          }
          
          console.log('Backend: URL to validate:', urlToValidate);
          
          // Only validate URL format if protocol is not 'none'
          if (!(column.urlConfig && column.urlConfig.protocol === 'none')) {
            try {
              new URL(urlToValidate);
            } catch {
              return res.status(400).json({ 
                message: `Invalid URL format for column '${column.name}'` 
              });
            }
          }
        }

        // Validate percent format for percent data type
        if (column.dataType === 'percent') {
          if (value !== undefined && value !== null && value !== '') {
            const numValue = Number(value);
            if (isNaN(numValue)) {
              return res.status(400).json({ 
                message: `Invalid percent value for column '${column.name}'. Must be a number.` 
              });
            }
            
            // Convert to decimal if needed (e.g., 50 -> 0.5 for 50%)
            if (column.percentConfig && column.percentConfig.displayFormat === 'percentage') {
              // If value is > 1, assume it's already in percentage format (50 for 50%)
              // If value is <= 1, assume it's in decimal format (0.5 for 50%)
              validatedData[column.name] = numValue > 1 ? numValue / 100 : numValue;
            } else {
              validatedData[column.name] = numValue;
            }
          } else {
            // Use default value if no value provided
            const defaultValue = column.percentConfig?.defaultValue || 0;
            validatedData[column.name] = defaultValue;
          }
        }

        // Check unique constraints (excluding current record)
        if (column.isUnique && value !== null && value !== '') {
          const existingRecord = await Record.findOne({
            tableId: record.tableId,
            [`data.${column.name}`]: value,
            _id: { $ne: recordId }
          });

          if (existingRecord) {
            return res.status(400).json({ 
              message: `Value '${value}' already exists in unique column '${column.name}'` 
            });
          }
        }

        validatedData[column.name] = value;
      }
    }

    record.data = validatedData;
    await record.save();

    res.status(200).json({
      success: true,
      message: 'Record updated successfully',
      data: record
    });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user._id;
    const siteId = req.siteId;

    const record = await Record.findOne({
      _id: recordId,
      userId,
      siteId
    });

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    await Record.deleteOne({ _id: recordId });

    res.status(200).json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Bulk delete records by IDs
// Bulk delete records by IDs
export const deleteMultipleRecords = async (req, res) => {
    console.log("🔄 deleteMultipleRecords called with:", req.body);
    console.log("🔄 Request user:", req.user);
    console.log("🔄 Request siteId:", req.siteId);
    
  try {
    const { recordIds } = req.body;
    
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ 
        message: "Authentication required. Please login first." 
      });
    }
    
    const userId = req.user._id;
    const siteId = req.siteId;
    
    // Check siteId
    if (!siteId) {
      return res.status(400).json({ 
        message: "Site context required" 
      });
    }

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({ message: "Record IDs array is required" });
    }

    // Verify all records exist and belong to user
    const records = await Record.find({
      _id: { $in: recordIds },
      userId,
      siteId
    });

    if (records.length !== recordIds.length) {
      return res.status(404).json({ 
        message: "Some records not found or do not belong to user" 
      });
    }

    // Delete all records
    const result = await Record.deleteMany({
      _id: { $in: recordIds },
      userId,
      siteId
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} records deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error deleting multiple records:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete all records in a table
// Delete all records in a table
export const deleteAllRecords = async (req, res) => {
    console.log("🔄 deleteAllRecords called with tableId:", req.params.tableId);
    console.log("🔄 Request user:", req.user);
    console.log("🔄 Request siteId:", req.siteId);
    
  try {
    const { tableId } = req.params;
    
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ 
        message: "Authentication required. Please login first." 
      });
    }
    
    const userId = req.user._id;
    const siteId = req.siteId;
    
    // Check siteId
    if (!siteId) {
      return res.status(400).json({ 
        message: "Site context required" 
      });
    }

    // Verify table exists and belongs to user
    const table = await Table.findOne({
      _id: tableId,
      userId,
      siteId
    });

    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    // Delete all records in the table
    const result = await Record.deleteMany({
      tableId,
      userId,
      siteId
    });

    res.status(200).json({
      success: true,
      message: `All ${result.deletedCount} records deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error deleting all records:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getTableStructure = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user._id;
    const siteId = req.siteId;

    // Verify table exists and belongs to user
    const table = await Table.findOne({
      _id: tableId,
      userId,
      siteId
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const columns = await Column.find({ tableId }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      data: {
        table,
        columns
      }
    });
  } catch (error) {
    console.error('Error fetching table structure:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
