import Record from '../model/Record.js';
import Table from '../model/Table.js';
import Column from '../model/Column.js';
import Database from '../model/Database.js';

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
    const { page = 1, limit = 50, sortRules } = req.query;
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
      // Default sorting by creation time
      sortOptions = { createdAt: -1 };
    }

    const records = await Record.find({ tableId })
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalRecords = await Record.countDocuments({ tableId });

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRecords,
        pages: Math.ceil(totalRecords / limit)
      },
      sortRules: parsedSortRules
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

    res.status(200).json({
      success: true,
      data: record
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
