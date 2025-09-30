import { Table, Column, Record, sequelize } from '../models/postgres/index.js';
import { hybridDbManager } from '../config/hybrid-db.js';
import Base from '../model/Base.js';
import BaseMember from '../model/BaseMember.js';
import { isSuperAdmin } from '../utils/permissionUtils.js';

// Helper function to apply sorting to records based on data types
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
    const column = columns.find(col => col.name === field || col.key === field);
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
      case 'multi_select':
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

// Test function to verify sorting works correctly with different data types
export const testSorting = async (req, res) => {
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

    // Check permissions
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: table.database_id, 
        userId 
      });
      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Get columns
    const columns = await Column.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });

    const transformedColumns = columns.map(column => ({
      id: column.id,
      name: column.name,
      key: column.key,
      dataType: column.data_type,
      order: column.order
    }));

    // Get sample records
    const records = await Record.findAll({
      where: { table_id: tableId },
      limit: 10
    });

    const transformedRecords = records.map(record => ({
      _id: record.id,
      tableId: record.table_id,
      userId: record.user_id,
      siteId: record.site_id,
      data: record.data,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));

    // Test sorting for each column
    const sortTests = [];
    
    for (const column of transformedColumns) {
      const sortConfig = {
        field: column.name,
        direction: 'asc',
        type: 'auto'
      };
      
      const sortedRecords = applySorting([...transformedRecords], sortConfig, transformedColumns);
      
      sortTests.push({
        columnName: column.name,
        dataType: column.dataType,
        sampleValues: sortedRecords.slice(0, 3).map(r => r.data?.[column.name]),
        sortDirection: 'asc'
      });
    }

    res.json({
      message: 'Sorting test completed',
      tableId: tableId,
      totalColumns: transformedColumns.length,
      totalRecords: transformedRecords.length,
      sortTests: sortTests
    });

  } catch (error) {
    console.error('Error testing sorting:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

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
    const { 
      page = 1, 
      limit = 50, 
      sortBy = 'created_at', 
      sortOrder = 'DESC',
      sortField,
      sortDirection = 'asc',
      sortRules,
      forceAscending
    } = req.query;
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

    // Get columns to determine data types for sorting
    const columns = await Column.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });

    // Transform columns to match expected format
    const transformedColumns = columns.map(column => ({
      id: column.id,
      name: column.name,
      key: column.key,
      dataType: column.data_type,
      order: column.order
    }));

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Parse sort rules if provided
    let parsedSortRules = [];
    if (sortRules) {
      try {
        parsedSortRules = JSON.parse(sortRules);
        console.log('📊 Parsed sort rules:', parsedSortRules);
      } catch (error) {
        console.error('Error parsing sort rules:', error);
        parsedSortRules = [];
      }
    }

    // Determine primary sort field and direction
    let primarySortField = sortField;
    let primarySortDirection = sortDirection;
    
    if (parsedSortRules.length > 0) {
      // Use the first sort rule as primary
      const firstRule = parsedSortRules[0];
      primarySortField = firstRule.field;
      primarySortDirection = firstRule.order === 'desc' ? 'desc' : 'asc';
      console.log('🎯 Using sort rule:', { field: primarySortField, direction: primarySortDirection });
    } else if (forceAscending === 'true') {
      // Default to ascending when no sort rules and forceAscending is true
      primarySortField = 'created_at';
      primarySortDirection = 'asc';
      console.log('🔄 Using force ascending:', { field: primarySortField, direction: primarySortDirection });
    } else {
      console.log('📋 Using default sort:', { field: primarySortField, direction: primarySortDirection });
    }

    // Determine if we need to sort by data field or system field
    const isDataField = primarySortField && primarySortField !== 'created_at' && primarySortField !== 'updated_at' && primarySortField !== '_id';
    
    let records, count;
    
    if (isDataField) {
      // For data fields, try to use PostgreSQL JSONB sorting first
      const column = transformedColumns.find(col => col.name === primarySortField || col.key === primarySortField);
      
      if (column && ['number', 'currency', 'percent', 'rating'].includes(column.dataType)) {
        // For numeric types, use PostgreSQL JSONB numeric sorting
        const result = await Record.findAndCountAll({
          where: { table_id: tableId },
          order: [
            [sequelize.literal(`(data->>'${primarySortField}')::numeric`), 
             primarySortDirection.toUpperCase()]
          ],
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
        
        count = result.count;
        records = result.rows.map(record => ({
          _id: record.id,
          tableId: record.table_id,
          userId: record.user_id,
          siteId: record.site_id,
          data: record.data,
          createdAt: record.created_at,
          updatedAt: record.updated_at
        }));
      } else if (column && ['date', 'datetime'].includes(column.dataType)) {
        // For date types, use PostgreSQL JSONB date sorting
        const result = await Record.findAndCountAll({
          where: { table_id: tableId },
          order: [
            [sequelize.literal(`(data->>'${primarySortField}')::timestamp`), 
             primarySortDirection.toUpperCase()]
          ],
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
        
        count = result.count;
        records = result.rows.map(record => ({
          _id: record.id,
          tableId: record.table_id,
          userId: record.user_id,
          siteId: record.site_id,
          data: record.data,
          createdAt: record.created_at,
          updatedAt: record.updated_at
        }));
      } else {
        // For text and other types, use PostgreSQL JSONB text sorting
        const result = await Record.findAndCountAll({
          where: { table_id: tableId },
          order: [
            [sequelize.literal(`data->>'${primarySortField}'`), 
             primarySortDirection.toUpperCase()]
          ],
          limit: parseInt(limit),
          offset: parseInt(offset)
        });

        count = result.count;
        records = result.rows.map(record => ({
      _id: record.id,
      tableId: record.table_id,
      userId: record.user_id,
      siteId: record.site_id,
      data: record.data,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));
      }
    } else {
      // For system fields, use database sorting
      const result = await Record.findAndCountAll({
        where: { table_id: tableId },
        order: [[primarySortField || sortBy || 'created_at', primarySortDirection.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      count = result.count;
      records = result.rows.map(record => ({
        _id: record.id,
        tableId: record.table_id,
        userId: record.user_id,
        siteId: record.site_id,
        data: record.data,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }));
    }

    res.json({
      message: 'Records retrieved successfully',
      records: records,
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
