import Table from '../model/Table.js';
import Record from '../model/Record.js';
import Column from '../model/Column.js';

// Helper function to apply filters to records (reuse from kanban)
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

// Helper function to apply sorting to records (reuse from kanban)
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

// Helper function to get date range for calendar view
const getDateRange = (viewType, currentDate) => {
  const date = new Date(currentDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  switch (viewType) {
    case 'day':
      const startOfDay = new Date(year, month, day);
      const endOfDay = new Date(year, month, day + 1);
      return { start: startOfDay, end: endOfDay };
    
    case 'week':
      const startOfWeek = new Date(date);
      startOfWeek.setDate(day - date.getDay() + 1); // Monday
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return { start: startOfWeek, end: endOfWeek };
    
    case 'month':
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 1);
      return { start: startOfMonth, end: endOfMonth };
    
    case 'year':
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);
      return { start: startOfYear, end: endOfYear };
    
    default:
      return { start: new Date(year, month, 1), end: new Date(year, month + 1, 1) };
  }
};

// Get Calendar data for a table
export const getCalendarData = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { 
      dateField, 
      viewType = 'month',
      currentDate = new Date().toISOString()
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
    
    // Check if tableId is MongoDB ObjectId or PostgreSQL UUID
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(tableId);
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(tableId);
    
    let table = null;
    let columns = [];
    
    if (isMongoId) {
      // MongoDB ObjectId
      table = await Table.findOne({
        _id: tableId,
        userId,
        siteId
      });
      if (table) {
        columns = await Column.find({ tableId }).sort({ order: 1 });
      }
    } else if (isUuid) {
      // PostgreSQL UUID - import and use PostgreSQL models
      const { Table: PostgresTable, Column: PostgresColumn } = await import('../models/postgres/index.js');
      table = await PostgresTable.findByPk(tableId);
      if (table) {
        columns = await PostgresColumn.findAll({ 
          where: { table_id: tableId },
          order: [['order', 'ASC']]
        });
      }
    } else {
      // Try both if format is unclear
      const { Table: PostgresTable, Column: PostgresColumn } = await import('../models/postgres/index.js');
      const [mongoTable, postgresTable] = await Promise.all([
        Table.findOne({ _id: tableId, userId, siteId }).catch(() => null),
        PostgresTable.findByPk(tableId).catch(() => null)
      ]);
      
      if (mongoTable) {
        table = mongoTable;
        columns = await Column.find({ tableId }).sort({ order: 1 });
      } else if (postgresTable) {
        table = postgresTable;
        columns = await PostgresColumn.findAll({ 
          where: { table_id: tableId },
          order: [['order', 'ASC']]
        });
      }
    }
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    // Find columns that can be used for Calendar (date, datetime)
    // Handle both MongoDB and PostgreSQL column formats
    const eligibleColumns = columns.filter(col => {
      const dataType = col.dataType || col.data_type || col.type;
      return ['date', 'datetime'].includes(dataType);
    });
    
    if (eligibleColumns.length === 0) {
      return res.json({
        success: true,
        eligible: false,
        message: 'Table needs at least one Date/Datetime column to use Calendar view',
        eligibleColumns: [],
        tableColumns: columns
      });
    }
    
    // Use provided dateField or default to first eligible column
    const dateColumn = dateField 
      ? eligibleColumns.find(col => col.name === dateField)
      : eligibleColumns[0];
    
    if (!dateColumn) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date field'
      });
    }
    
    // Get all records for this table - handle both MongoDB and PostgreSQL
    let records = [];
    if (isMongoId) {
      // MongoDB ObjectId
      records = await Record.find({ tableId, userId, siteId }).sort({ createdAt: -1 });
    } else if (isUuid) {
      // PostgreSQL UUID
      const { Record: PostgresRecord } = await import('../models/postgres/index.js');
      records = await PostgresRecord.findAll({ 
        where: { table_id: tableId },
        order: [['created_at', 'DESC']]
      });
    } else {
      // Try both if format is unclear
      const { Record: PostgresRecord } = await import('../models/postgres/index.js');
      const [mongoRecords, postgresRecords] = await Promise.all([
        Record.find({ tableId, userId, siteId }).sort({ createdAt: -1 }).catch(() => []),
        PostgresRecord.findAll({ 
          where: { table_id: tableId },
          order: [['created_at', 'DESC']]
        }).catch(() => [])
      ]);
      records = [...mongoRecords, ...postgresRecords];
    }
    
    // Filter records that have valid date values
    console.log('🔍 Calendar API Debug:', {
      totalRecords: records.length,
      dateColumnName: dateColumn.name,
      sampleRecord: records[0]?.data,
      dateValueInSample: records[0]?.data?.[dateColumn.name]
    });
    
    const calendarRecords = records.filter(record => {
      const dateValue = record.data?.[dateColumn.name];
      const isValid = dateValue && !isNaN(new Date(dateValue).getTime());
      console.log('🔍 Record filter:', {
        recordId: record._id || record.id,
        dateValue,
        isValid,
        recordData: record.data
      });
      return isValid;
    });
    
    console.log('🔍 Filtered calendar records:', calendarRecords.length);

    // Get date range for the current view
    const { start, end } = getDateRange(viewType, currentDate);
    
    console.log('🔍 Date range debug:', {
      viewType,
      currentDate,
      start: start.toISOString(),
      end: end.toISOString(),
      startDate: start.toDateString(),
      endDate: end.toDateString()
    });
    
    // Group records by date
    const eventsByDate = {};
    let eventsInRange = 0;
    
    calendarRecords.forEach(record => {
      const recordData = record.toObject ? record.toObject() : record;
      
      // Ensure we preserve the record ID
      if (!recordData._id && !recordData.id) {
        recordData._id = record._id || record.id;
      }
      
      const dateValue = recordData.data?.[dateColumn.name];
      const eventDate = new Date(dateValue);
      
      console.log('🔍 Event date check:', {
        recordId: recordData._id || recordData.id,
        dateValue,
        eventDate: eventDate.toISOString(),
        eventDateString: eventDate.toDateString(),
        inRange: eventDate >= start && eventDate < end,
        start: start.toISOString(),
        end: end.toISOString()
      });
      
      // Check if event is within the current view range
      if (eventDate >= start && eventDate < end) {
        eventsInRange++;
        const dateKey = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];
        }
        
        eventsByDate[dateKey].push({
          ...recordData,
          eventDate: eventDate,
          dateKey: dateKey
        });
      }
    });
    
    console.log('🔍 Events in range:', eventsInRange, 'out of', calendarRecords.length);
    
    // Sort events within each date
    Object.keys(eventsByDate).forEach(dateKey => {
      eventsByDate[dateKey].sort((a, b) => {
        const timeA = a.eventDate.getTime();
        const timeB = b.eventDate.getTime();
        return timeA - timeB;
      });
    });
    
    res.json({
      success: true,
      eligible: true,
      data: {
        events: eventsByDate,
        dateField: dateColumn.name,
        dateColumn: dateColumn,
        eligibleColumns: eligibleColumns,
        viewType: viewType,
        currentDate: currentDate,
        dateRange: { start, end },
        totalRecords: calendarRecords.length
      }
    });
    
  } catch (error) {
    console.error('Error getting Calendar data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Calendar configuration for a table
export const getCalendarConfig = async (req, res) => {
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
    
    // Check if tableId is MongoDB ObjectId or PostgreSQL UUID
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(tableId);
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(tableId);
    
    let table = null;
    let columns = [];
    
    if (isMongoId) {
      // MongoDB ObjectId
      table = await Table.findOne({
        _id: tableId,
        userId,
        siteId
      });
      if (table) {
        columns = await Column.find({ tableId }).sort({ order: 1 });
      }
    } else if (isUuid) {
      // PostgreSQL UUID - import and use PostgreSQL models
      const { Table: PostgresTable, Column: PostgresColumn } = await import('../models/postgres/index.js');
      table = await PostgresTable.findByPk(tableId);
      if (table) {
        columns = await PostgresColumn.findAll({ 
          where: { table_id: tableId },
          order: [['order', 'ASC']]
        });
      }
    } else {
      // Try both if format is unclear
      const { Table: PostgresTable, Column: PostgresColumn } = await import('../models/postgres/index.js');
      const [mongoTable, postgresTable] = await Promise.all([
        Table.findOne({ _id: tableId, userId, siteId }).catch(() => null),
        PostgresTable.findByPk(tableId).catch(() => null)
      ]);
      
      if (mongoTable) {
        table = mongoTable;
        columns = await Column.find({ tableId }).sort({ order: 1 });
      } else if (postgresTable) {
        table = postgresTable;
        columns = await PostgresColumn.findAll({ 
          where: { table_id: tableId },
          order: [['order', 'ASC']]
        });
      }
    }
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    // Find columns that can be used for Calendar (date, datetime)
    // Handle both MongoDB and PostgreSQL column formats
    const eligibleColumns = columns.filter(col => {
      const dataType = col.dataType || col.data_type || col.type;
      return ['date', 'datetime'].includes(dataType);
    });
    
    if (eligibleColumns.length === 0) {
      return res.json({
        success: true,
        eligible: false,
        message: 'Table needs at least one Date/Datetime column to use Calendar view',
        eligibleColumns: [],
        tableColumns: columns
      });
    }
    
    // Get default date column (first eligible column)
    const defaultDateField = eligibleColumns[0];
    
    res.json({
      success: true,
      eligible: true,
      eligibleColumns: eligibleColumns,
      defaultDateField: defaultDateField,
      allColumns: columns // Include all columns for sorting/filtering
    });
    
  } catch (error) {
    console.error('Error getting Calendar config:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update record date when dragging events
export const updateRecordDate = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { newDate, dateField } = req.body;
    
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
    
    if (!recordId || !newDate || !dateField) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: recordId, newDate, dateField'
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
    
    // Update the record's date field value
    const updatedData = { ...record.data };
    updatedData[dateField] = newDate;
    
    record.data = updatedData;
    await record.save();
    
    // Update Metabase table
    try {
      const { updateMetabaseTable } = await import('../utils/metabaseTableCreator.js');
      const metabaseRecord = {
        id: record._id,
        table_id: record.tableId,
        user_id: record.userId,
        site_id: record.siteId,
        data: record.data,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      };
      
      // Get database ID from table
      const table = await Table.findById(record.tableId).populate('databaseId');
      if (table && table.databaseId) {
        await updateMetabaseTable(record.tableId, metabaseRecord, 'update', [], table.databaseId._id);
        console.log(`✅ Metabase table updated for calendar record: ${record._id}`);
      }
    } catch (metabaseError) {
      console.error('Metabase update failed:', metabaseError);
      // Don't fail the entire operation if metabase fails
    }
    
    res.json({
      success: true,
      message: 'Record date updated successfully',
      data: record
    });
    
  } catch (error) {
    console.error('Error updating record date:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

