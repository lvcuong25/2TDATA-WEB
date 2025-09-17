import Table from '../model/Table.js';
import Record from '../model/Record.js';
import Column from '../model/Column.js';

// Helper function to apply filters to records
const applyFilters = (records, filters, columns) => {
  if (!filters || Object.keys(filters).length === 0) {
    return records;
  }

  return records.filter(record => {
    return Object.entries(filters).every(([fieldName, filterValue]) => {
      if (!filterValue) return true;

      const recordValue = record.data?.[fieldName];
      const column = columns.find(col => col.name === fieldName);

      // Handle different data types and filter operators
      if (typeof filterValue === 'object' && filterValue.operator) {
        const { operator, value } = filterValue;
        
        switch (operator) {
          case 'contains':
            return recordValue && String(recordValue).toLowerCase().includes(String(value).toLowerCase());
          case 'not_contains':
            return !recordValue || !String(recordValue).toLowerCase().includes(String(value).toLowerCase());
          case 'equals':
            return recordValue === value;
          case 'not_equals':
            return recordValue !== value;
          case 'starts_with':
            return recordValue && String(recordValue).toLowerCase().startsWith(String(value).toLowerCase());
          case 'ends_with':
            return recordValue && String(recordValue).toLowerCase().endsWith(String(value).toLowerCase());
          case 'is_empty':
            return !recordValue || recordValue === '' || recordValue === null || recordValue === undefined;
          case 'is_not_empty':
            return recordValue && recordValue !== '' && recordValue !== null && recordValue !== undefined;
          case 'greater_than':
            return recordValue && Number(recordValue) > Number(value);
          case 'less_than':
            return recordValue && Number(recordValue) < Number(value);
          case 'greater_equal':
            return recordValue && Number(recordValue) >= Number(value);
          case 'less_equal':
            return recordValue && Number(recordValue) <= Number(value);
          case 'date_is':
            if (!recordValue || !value) return false;
            const recordDate = new Date(recordValue).toDateString();
            const filterDate = new Date(value).toDateString();
            return recordDate === filterDate;
          case 'date_before':
            return recordValue && new Date(recordValue) < new Date(value);
          case 'date_after':
            return recordValue && new Date(recordValue) > new Date(value);
          case 'in':
            return Array.isArray(value) && value.includes(recordValue);
          case 'not_in':
            return !Array.isArray(value) || !value.includes(recordValue);
          default:
            return true;
        }
      } else {
        // Simple string matching for backward compatibility
        if (Array.isArray(filterValue)) {
          return filterValue.includes(recordValue);
        }
        return recordValue && String(recordValue).toLowerCase().includes(String(filterValue).toLowerCase());
      }
    });
  });
};

// Helper function to apply sorting to records
const applySorting = (records, sortConfig, columns) => {
  if (!sortConfig || !sortConfig.field) {
    return records;
  }

  const { field, direction = 'asc', type = 'auto' } = sortConfig;

  return records.sort((a, b) => {
    const valueA = a.data?.[field];
    const valueB = b.data?.[field];

    // Handle null/undefined values - always put them at the end
    if (valueA == null && valueB == null) return 0;
    if (valueA == null) return 1;
    if (valueB == null) return -1;

    let comparison = 0;

    // Determine sort type based on column data type or auto-detect
    const column = columns.find(col => col.name === field);
    const dataType = column?.dataType || type;

    switch (dataType) {
      case 'number':
      case 'currency':
      case 'percent':
      case 'rating':
        comparison = Number(valueA) - Number(valueB);
        break;
        
      case 'date':
      case 'datetime':
        comparison = new Date(valueA) - new Date(valueB);
        break;
        
      case 'checkbox':
        comparison = (valueA ? 1 : 0) - (valueB ? 1 : 0);
        break;
        
      case 'text':
      case 'long_text':
      case 'email':
      case 'url':
      case 'phone':
      case 'single_select':
      case 'auto':
      default:
        // Try numeric comparison first if both values are numbers
        if (!isNaN(valueA) && !isNaN(valueB)) {
          comparison = Number(valueA) - Number(valueB);
        } else {
          // Fallback to string comparison
          comparison = String(valueA).localeCompare(String(valueB));
        }
        break;
    }

    return direction === 'desc' ? -comparison : comparison;
  });
};

// Get Kanban data for a table with sorting and filtering
export const getKanbanData = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { 
      stackByField, 
      sortBy, 
      sortDirection = 'asc',
      sortType = 'auto',
      filters = {},
      search = ''
    } = req.query;
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
    }
    
    const userId = req.user._id;
    const siteId = req.siteId;
    
    // Check if siteId is available
    if (!siteId) {
      return res.status(400).json({
        success: false,
        message: 'Site ID not found',
        error: 'SITE_ID_REQUIRED'
      });
    }
    
    // Verify table exists and belongs to user
    const table = await Table.findOne({
      _id: tableId,
      userId,
      siteId
    });
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    // Get all columns for this table
    const columns = await Column.find({ tableId }).sort({ order: 1 });
    
    // Find columns that can be used for Kanban (single_select, multi_select)
    const eligibleColumns = columns.filter(col => 
      ['single_select', 'select', 'multi_select', 'multiselect'].includes(col.dataType)
    );
    
    if (eligibleColumns.length === 0) {
      return res.json({
        success: true,
        eligible: false,
        message: 'Table needs at least one Single Select column to use Kanban view',
        eligibleColumns: [],
        tableColumns: columns
      });
    }
    
    // Use provided stackByField or default to first eligible column
    const stackByColumn = stackByField 
      ? eligibleColumns.find(col => col.name === stackByField)
      : eligibleColumns[0];
    
    if (!stackByColumn) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stackBy field'
      });
    }
    
    // Get available values from column config
    let availableValues = [];
    if (stackByColumn.options) {
      availableValues = stackByColumn.options;
    } else if (stackByColumn.singleSelectConfig && stackByColumn.singleSelectConfig.options) {
      availableValues = stackByColumn.singleSelectConfig.options;
    } else if (stackByColumn.multiSelectConfig && stackByColumn.multiSelectConfig.options) {
      availableValues = stackByColumn.multiSelectConfig.options;
    }
    
    // Get all records for this table
    let records = await Record.find({ tableId, userId, siteId }).sort({ createdAt: -1 });

    // Parse filters if they come as string
    let parsedFilters = {};
    try {
      if (typeof filters === 'string') {
        parsedFilters = JSON.parse(filters);
      } else {
        parsedFilters = filters;
      }
    } catch (error) {
      console.warn('Error parsing filters:', error);
      parsedFilters = {};
    }

    // Apply search filter if provided
    if (search) {
      records = records.filter(record => {
        return Object.values(record.data || {}).some(value => {
          if (value == null) return false;
          return String(value).toLowerCase().includes(search.toLowerCase());
        });
      });
    }

    // Apply filters
    records = applyFilters(records, parsedFilters, columns);

    // Apply sorting if specified
    if (sortBy) {
      const sortConfig = {
        field: sortBy,
        direction: sortDirection,
        type: sortType
      };
      records = applySorting(records, sortConfig, columns);
    }
    
    // Group records by stackBy field value
    const kanbanColumns = {};
    
    // Initialize columns with available values
    availableValues.forEach(value => {
      kanbanColumns[value] = {
        id: value,
        title: value,
        records: [],
        count: 0
      };
    });
    
    // Add "Uncategorized" column for records without a value
    kanbanColumns['Uncategorized'] = {
      id: 'Uncategorized',
      title: 'Uncategorized',
      records: [],
      count: 0
    };
    
    // Group records into columns
    records.forEach(record => {
      const recordData = record.toObject ? record.toObject() : record;
      const stackByValue = recordData.data?.[stackByColumn.name];
      
      if (stackByValue && availableValues.includes(stackByValue)) {
        kanbanColumns[stackByValue].records.push(recordData);
        kanbanColumns[stackByValue].count++;
      } else {
        kanbanColumns['Uncategorized'].records.push(recordData);
        kanbanColumns['Uncategorized'].count++;
      }
    });

    // Sort records within each column if sorting is applied
    if (sortBy) {
      const sortConfig = {
        field: sortBy,
        direction: sortDirection,
        type: sortType
      };
      
      Object.values(kanbanColumns).forEach(column => {
        column.records = applySorting(column.records, sortConfig, columns);
      });
    }
    
    // Convert to array format
    const kanbanData = Object.values(kanbanColumns);
    
    res.json({
      success: true,
      eligible: true,
      data: {
        columns: kanbanData,
        stackByField: stackByColumn.name,
        stackByColumn: stackByColumn,
        eligibleColumns: eligibleColumns,
        availableValues: availableValues,
        totalRecords: records.length,
        appliedFilters: parsedFilters,
        appliedSort: sortBy ? { field: sortBy, direction: sortDirection, type: sortType } : null,
        searchQuery: search
      }
    });
    
  } catch (error) {
    console.error('Error getting Kanban data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get available filter operators for a field type
export const getFilterOperators = async (req, res) => {
  try {
    const { fieldType } = req.params;
    
    const operatorsByType = {
      text: ['contains', 'not_contains', 'equals', 'not_equals', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
      long_text: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
      number: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'is_empty', 'is_not_empty'],
      currency: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'is_empty', 'is_not_empty'],
      percent: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'is_empty', 'is_not_empty'],
      date: ['date_is', 'date_before', 'date_after', 'is_empty', 'is_not_empty'],
      datetime: ['date_is', 'date_before', 'date_after', 'is_empty', 'is_not_empty'],
      single_select: ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty'],
      multi_select: ['contains', 'not_contains', 'in', 'not_in', 'is_empty', 'is_not_empty'],
      checkbox: ['equals', 'not_equals'],
      email: ['contains', 'not_contains', 'equals', 'not_equals', 'is_empty', 'is_not_empty'],
      url: ['contains', 'not_contains', 'equals', 'not_equals', 'is_empty', 'is_not_empty'],
      phone: ['contains', 'not_contains', 'equals', 'not_equals', 'is_empty', 'is_not_empty'],
      rating: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'is_empty', 'is_not_empty']
    };

    const operators = operatorsByType[fieldType] || operatorsByType['text'];
    
    res.json({
      success: true,
      operators: operators.map(op => ({
        value: op,
        label: op.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }))
    });

  } catch (error) {
    console.error('Error getting filter operators:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update record when dragging between columns (change stackBy field value)
export const updateRecordColumn = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { newColumnValue, stackByField } = req.body;
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
    }
    
    const userId = req.user._id;
    const siteId = req.siteId;
    
    if (!recordId || !newColumnValue || !stackByField) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: recordId, newColumnValue, stackByField'
      });
    }
    
    // Find the record
    const record = await Record.findOne({
      _id: recordId,
      userId,
      siteId
    });
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }
    
    // Update the record's stackBy field value
    const updatedData = { ...record.data };
    updatedData[stackByField] = newColumnValue === 'Uncategorized' ? null : newColumnValue;
    
    record.data = updatedData;
    await record.save();
    
    res.json({
      success: true,
      message: 'Record updated successfully',
      data: record
    });
    
  } catch (error) {
    console.error('Error updating record column:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Add new column value (for stackBy field)
export const addKanbanColumn = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { columnName, newValue } = req.body;
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
    }
    
    const userId = req.user._id;
    const siteId = req.siteId;
    
    if (!columnName || !newValue) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: columnName, newValue'
      });
    }
    
    // Verify table exists and belongs to user
    const table = await Table.findOne({
      _id: tableId,
      userId,
      siteId
    });
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    // Find the column
    const column = await Column.findOne({ 
      tableId, 
      name: columnName 
    });
    
    if (!column) {
      return res.status(404).json({
        success: false,
        message: 'Column not found'
      });
    }
    
    // Add new value to the column's options
    if (!column.options) column.options = [];
    if (!column.options.includes(newValue)) {
      column.options.push(newValue);
      
      // Also add to specific config based on dataType
      if (column.dataType === 'single_select' && column.singleSelectConfig) {
        if (!column.singleSelectConfig.options) column.singleSelectConfig.options = [];
        if (!column.singleSelectConfig.options.includes(newValue)) {
          column.singleSelectConfig.options.push(newValue);
        }
      } else if (column.dataType === 'multi_select' && column.multiSelectConfig) {
        if (!column.multiSelectConfig.options) column.multiSelectConfig.options = [];
        if (!column.multiSelectConfig.options.includes(newValue)) {
          column.multiSelectConfig.options.push(newValue);
        }
      }
      
      await column.save();
    }
    
    res.json({
      success: true,
      message: 'Column value added successfully',
      data: column
    });
    
  } catch (error) {
    console.error('Error adding Kanban column:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Kanban configuration for a table
export const getKanbanConfig = async (req, res) => {
  try {
    const { tableId } = req.params;
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
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
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    // Get all columns for this table
    const columns = await Column.find({ tableId }).sort({ order: 1 });
    
    // Find columns that can be used for Kanban (single_select, multi_select)
    const eligibleColumns = columns.filter(col => 
      ['single_select', 'select', 'multi_select', 'multiselect'].includes(col.dataType)
    );
    
    if (eligibleColumns.length === 0) {
      return res.json({
        success: true,
        eligible: false,
        message: 'Table needs at least one Single Select column to use Kanban view',
        eligibleColumns: [],
        tableColumns: columns
      });
    }
    
    // Get default stackBy column (first eligible column)
    const defaultStackBy = eligibleColumns[0];
    
    // Get available values from column config
    let availableValues = [];
    if (defaultStackBy.options) {
      availableValues = defaultStackBy.options;
    } else if (defaultStackBy.singleSelectConfig && defaultStackBy.singleSelectConfig.options) {
      availableValues = defaultStackBy.singleSelectConfig.options;
    } else if (defaultStackBy.multiSelectConfig && defaultStackBy.multiSelectConfig.options) {
      availableValues = defaultStackBy.multiSelectConfig.options;
    }
    
    res.json({
      success: true,
      eligible: true,
      eligibleColumns: eligibleColumns,
      defaultStackBy: defaultStackBy,
      availableValues: availableValues,
      allColumns: columns // Include all columns for sorting/filtering
    });
    
  } catch (error) {
    console.error('Error getting Kanban config:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
