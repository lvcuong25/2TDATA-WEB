import { Table, Column, Record } from '../models/postgres/index.js';
import Database from '../model/Database.js';
import Base from '../model/Base.js';
import BaseMember from '../model/BaseMember.js';
import Organization from '../model/Organization.js';
import { isSuperAdmin, getUserDatabaseRole } from '../utils/permissionUtils.js';
import { createMetabaseTable } from '../utils/metabaseTableCreator.js';

// Table Controllers using PostgreSQL
export const createTable = async (req, res) => {
  try {
    const { baseId, databaseId, name, description } = req.body;
    const userId = req.user?._id?.toString();

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Table name is required' });
    }

    // Accept both baseId and databaseId (they are the same thing)
    const actualBaseId = baseId || databaseId;
    
    if (!actualBaseId) {
      return res.status(400).json({ message: 'Base ID is required' });
    }

    // Verify base exists (Database is alias of Base)
    const base = await Base.findById(actualBaseId);

    if (!base) {
      return res.status(404).json({ message: 'Base not found' });
    }

    // Check if user is a member of this database and has permission to create tables
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: actualBaseId, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }

      // Only owner and manager can create tables
      if (baseMember.role !== 'owner' && baseMember.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied - insufficient permissions to create tables' });
      }
    }

    // Check if table name already exists in this database
    const existingTable = await Table.findOne({
      where: {
        name: name.trim(),
        database_id: actualBaseId
      }
    });

    if (existingTable) {
      return res.status(400).json({ message: 'Table name already exists in this database' });
    }

    // Create table in PostgreSQL
    const newTable = await Table.create({
      name: name.trim(),
      database_id: actualBaseId,
      user_id: userId,
      site_id: base.siteId?.toString(),
      description: description || '',
      table_access_rule: {
        userIds: [],
        allUsers: false,
        access: []
      },
      column_access_rules: [],
      record_access_rules: [],
      cell_access_rules: []
    });

    // Create metabase table
    try {
      await createMetabaseTable(newTable.id, name.trim(), base.organizationId?.toString());
    } catch (metabaseError) {
      console.error('Metabase table creation failed:', metabaseError);
      // Don't fail the entire operation if metabase fails
    }

    res.status(201).json({
      message: 'Table created successfully',
      table: {
        id: newTable.id,
        name: newTable.name,
        databaseId: newTable.database_id,
        userId: newTable.user_id,
        siteId: newTable.site_id,
        description: newTable.description,
        createdAt: newTable.created_at,
        updatedAt: newTable.updated_at
      }
    });

  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getTables = async (req, res) => {
  try {
    const { baseId, databaseId } = req.query;
    const userId = req.user?._id?.toString();

    const actualBaseId = baseId || databaseId;
    
    if (!actualBaseId) {
      return res.status(400).json({ message: 'Base ID is required' });
    }

    // Check if user has access to this database
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: actualBaseId, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }
    }

    // Get tables from PostgreSQL
    const tables = await Table.findAll({
      where: {
        database_id: actualBaseId
      },
      order: [['created_at', 'ASC']]
    });

    // Transform to match expected format
    const transformedTables = tables.map(table => ({
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
    }));

    res.json({
      message: 'Tables retrieved successfully',
      tables: transformedTables
    });

  } catch (error) {
    console.error('Error getting tables:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getTableById = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user?._id?.toString();

    // Get table from PostgreSQL
    const table = await Table.findByPk(tableId);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user has access to this table's database
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: table.database_id, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }
    }

    // Transform to match expected format
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

    res.json({
      message: 'Table retrieved successfully',
      table: transformedTable
    });

  } catch (error) {
    console.error('Error getting table:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { name, description } = req.body;
    const userId = req.user?._id?.toString();

    // Get table from PostgreSQL
    const table = await Table.findByPk(tableId);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user has permission to update this table
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: table.database_id, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }

      // Only owner and manager can update tables
      if (baseMember.role !== 'owner' && baseMember.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied - insufficient permissions to update tables' });
      }
    }

    // Check if new name conflicts with existing tables
    if (name && name.trim() !== table.name) {
      const existingTable = await Table.findOne({
        where: {
          name: name.trim(),
          database_id: table.database_id,
          id: { [require('sequelize').Op.ne]: tableId }
        }
      });

      if (existingTable) {
        return res.status(400).json({ message: 'Table name already exists in this database' });
      }
    }

    // Update table
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;

    await table.update(updateData);

    // Transform to match expected format
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

    res.json({
      message: 'Table updated successfully',
      table: transformedTable
    });

  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user?._id?.toString();

    // Get table from PostgreSQL
    const table = await Table.findByPk(tableId);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user has permission to delete this table
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: table.database_id, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }

      // Only owner can delete tables
      if (baseMember.role !== 'owner') {
        return res.status(403).json({ message: 'Access denied - only owners can delete tables' });
      }
    }

    // Delete related data first (due to foreign key constraints)
    await Record.destroy({ where: { table_id: tableId } });
    await Column.destroy({ where: { table_id: tableId } });
    
    // Delete the table
    await table.destroy();

    res.json({
      message: 'Table deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};