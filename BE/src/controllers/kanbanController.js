import Table from '../model/Table.js';
import Record from '../model/Record.js';
import Column from '../model/Column.js';

// Get Kanban data for a table
export const getKanbanData = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { stackByField } = req.query;
    
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
    const records = await Record.find({ tableId, userId, siteId }).sort({ createdAt: -1 });
    
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
        availableValues: availableValues
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
      availableValues: availableValues
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
