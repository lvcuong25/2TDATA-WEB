import { Table, Column, Record } from '../models/postgres/index.js';
import { hybridDbManager } from '../config/hybrid-db.js';
import Base from '../model/Base.js';
import BaseMember from '../model/BaseMember.js';
import { isSuperAdmin } from '../utils/permissionUtils.js';

// Record Controllers for PostgreSQL
export const createRecord = async (req, res) => {
  try {
    const { tableId, data } = req.body;
    const userId = req.user._id;
    const siteId = req.siteId;

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    // Verify table exists in PostgreSQL
    const table = await Table.findByPk(tableId);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user has permission to create records
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: table.database_id, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }

      // Check table access rules
      const tableAccessRule = table.table_access_rule;
      if (tableAccessRule && !tableAccessRule.allUsers) {
        if (!tableAccessRule.userIds.includes(userId)) {
          return res.status(403).json({ message: 'Access denied - you do not have permission to create records in this table' });
        }
      }
    }

    // Create record in PostgreSQL
    const newRecord = await Record.create({
      table_id: tableId,
      user_id: userId,
      site_id: siteId,
      data: data || {}
    });

    console.log(`✅ Record created in PostgreSQL: ${newRecord.id}`);

    res.status(201).json({
      message: 'Record created successfully',
      record: {
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
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const getRecords = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
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

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get records from PostgreSQL
    const { count, rows: records } = await Record.findAndCountAll({
      where: {
        table_id: tableId
      },
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Transform to match frontend expected format
    const transformedRecords = records.map(record => ({
      _id: record.id,
      tableId: record.table_id,
      userId: record.user_id,
      siteId: record.site_id,
      data: record.data,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));

    res.json({
      message: 'Records retrieved successfully',
      records: transformedRecords,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error getting records:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const getRecordById = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user._id;

    // Get record from PostgreSQL
    const record = await Record.findByPk(recordId);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Get table to check permissions
    const table = await Table.findByPk(record.table_id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user has access to this record
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: table.database_id, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({
      message: 'Record retrieved successfully',
      record: {
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
    console.error('Error getting record:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const updateRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { data } = req.body;
    const userId = req.user._id;

    // Get record from PostgreSQL
    const record = await Record.findByPk(recordId);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Get table to check permissions
    const table = await Table.findByPk(record.table_id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user has permission to update this record
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: table.database_id, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Check record access rules
      const recordAccessRules = table.record_access_rules;
      if (recordAccessRules && recordAccessRules.length > 0) {
        // Implement record-level access control logic here
        // For now, allow if user is member of the database
      }
    }

    // Update record
    await record.update({
      data: data || record.data
    });

    console.log(`✅ Record updated in PostgreSQL: ${record.id}`);

    res.json({
      message: 'Record updated successfully',
      record: {
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
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const deleteRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user._id;

    // Get record from PostgreSQL
    const record = await Record.findByPk(recordId);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Get table to check permissions
    const table = await Table.findByPk(record.table_id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user has permission to delete this record
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: table.database_id, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Only owner and manager can delete records
      if (baseMember.role !== 'owner' && baseMember.role !== 'manager') {
        return res.status(403).json({ 
          message: 'Access denied - only database owners and managers can delete records' 
        });
      }
    }

    // Delete record
    await record.destroy();

    console.log(`✅ Record deleted from PostgreSQL: ${recordId}`);

    res.json({
      message: 'Record deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const bulkCreateRecords = async (req, res) => {
  try {
    const { tableId, records } = req.body;
    const userId = req.user._id;
    const siteId = req.siteId;

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Records array is required' });
    }

    // Verify table exists
    const table = await Table.findByPk(tableId);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user has permission to create records
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: table.database_id, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Create records in bulk
    const recordsToCreate = records.map(recordData => ({
      table_id: tableId,
      user_id: userId,
      site_id: siteId,
      data: recordData.data || {}
    }));

    const createdRecords = await Record.bulkCreate(recordsToCreate);

    console.log(`✅ ${createdRecords.length} records created in PostgreSQL`);

    res.status(201).json({
      message: `${createdRecords.length} records created successfully`,
      records: createdRecords.map(record => ({
        _id: record.id,
        tableId: record.table_id,
        userId: record.user_id,
        siteId: record.site_id,
        data: record.data,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }))
    });

  } catch (error) {
    console.error('Error bulk creating records:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const getTableStructure = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user._id;

    if (!tableId) {
      return res.status(400).json({ message: "Table ID is required" });
    }

    // Verify table exists in PostgreSQL
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
        return res.status(403).json({ message: "Access denied - user is not a member of this database" });
      }
    }

    // Get columns from PostgreSQL
    const columns = await Column.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });

    // Transform table to match expected format
    const transformedTable = {
      id: table.id,
      name: table.name,
      databaseId: table.database_id,
      userId: table.user_id,
      siteId: table.site_id,
      description: table.description,
      tableAccessRule: table.table_access_rule,
      columnAccessRules: table.column_access_rules,
      recordAccessRules: table.record_access_rules,
      cellAccessRules: table.cell_access_rules,
      createdAt: table.created_at,
      updatedAt: table.updated_at
    };

    // Transform columns to match expected format
    const transformedColumns = columns.map(column => ({
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
    }));

    res.status(200).json({
      success: true,
      data: {
        table: transformedTable,
        columns: transformedColumns
      }
    });

  } catch (error) {
    console.error('Error getting table structure:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAllRecords = async (req, res) => {
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

    // Verify table exists
    const table = await Table.findByPk(tableId);

    if (!table) {
      return res.status(404).json({ message: "Table not found" });
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

      // Check if user has permission to delete records
      if (baseMember.role === 'member') {
        return res.status(403).json({ 
          message: "Access denied - only owners and managers can delete all records" 
        });
      }
    }

    // Delete all records from PostgreSQL
    const deletedCount = await Record.destroy({
      where: { table_id: tableId }
    });

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} records`,
      deletedCount: deletedCount
    });

  } catch (error) {
    console.error('Error deleting all records:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const deleteMultipleRecords = async (req, res) => {
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

    // Verify all records exist and get their table info
    const records = await Record.findAll({
      where: { id: recordIds },
      include: [{
        model: Table,
        as: 'table'
      }]
    });

    if (records.length !== recordIds.length) {
      return res.status(404).json({ 
        message: "Some records not found" 
      });
    }

    // Check if user is a member of the database for all records
    if (!isSuperAdmin(req.user)) {
      const tableIds = [...new Set(records.map(r => r.table_id))];
      const tables = await Table.findAll({ where: { id: tableIds } });
      
      for (const table of tables) {
        const baseMember = await BaseMember.findOne({
          databaseId: table.database_id,
          userId
        });

        if (!baseMember) {
          return res.status(403).json({ 
            message: "Access denied - you are not a member of this database" 
          });
        }

        // Check if user has permission to delete records
        if (baseMember.role === 'member') {
          return res.status(403).json({ 
            message: "Access denied - only owners and managers can delete records" 
          });
        }
      }
    }

    // Delete records from PostgreSQL
    const deletedCount = await Record.destroy({
      where: { id: recordIds }
    });

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} records`,
      deletedCount: deletedCount
    });

  } catch (error) {
    console.error('Error deleting multiple records:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};
