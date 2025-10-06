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
    // Tạo default permissions cho tất cả members
    try {
      const TablePermission = (await import('../model/TablePermission.js')).default;
      const mongoose = (await import('mongoose')).default;
      
      const defaultPermission = new TablePermission({
        tableId: newTable.id, // Use actual table UUID
        databaseId: new mongoose.Types.ObjectId(actualBaseId), // Convert to ObjectId
        targetType: 'all_members',
        name: newTable.name, // Thêm field name required
        permissions: {
          canView: true,
          canEditStructure: true, // Default: bật tất cả quyền cho tất cả thành viên
          canEditData: true,
          canAddData: true,
          isHidden: false
        },
        viewPermissions: {
          canView: true,
          canAddView: true, // Default: bật tất cả quyền cho tất cả thành viên
          canEditView: true, // Default: bật tất cả quyền cho tất cả thành viên
          isHidden: false
        },
        createdBy: new mongoose.Types.ObjectId(userId), // Convert to ObjectId
        isDefault: true, // Đánh dấu là permission mặc định
        note: 'Default permission created automatically when table was created (postgres)'
      });

      await defaultPermission.save();
      console.log('✅ Default table permission created successfully (postgres)');
    } catch (permissionError) {
      console.error('❌ Error creating default table permission (postgres):', permissionError);
      // Không throw error để không ảnh hưởng đến việc tạo table
    }

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
    const { databaseId } = req.params;
    const userId = req.user?._id?.toString();

    const actualBaseId = databaseId;
    
    if (!actualBaseId) {
      return res.status(400).json({ message: 'Base ID is required' });
    }

    // Check if user has access to this database
    let baseMember = null;
    if (!isSuperAdmin(req.user)) {
      baseMember = await BaseMember.findOne({ 
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

    let visibleTables = tables;

    // Check table permissions for members and managers (database owners and table owners see all tables)
    const isDatabaseOwner = baseMember && baseMember.role === 'owner';
    const isTableOwner = tables.some(table => table.user_id && table.user_id.toString() === userId.toString());
    
    if (!isSuperAdmin(req.user) && baseMember && !isDatabaseOwner && !isTableOwner && (baseMember.role === 'member' || baseMember.role === 'manager')) {
      const TablePermission = (await import('../model/TablePermission.js')).default;
      
      // Get all table permissions for this user
      const tablePermissions = await TablePermission.find({
        tableId: { $in: tables.map(t => t.id) },
        $or: [
          { targetType: 'all_members' },
          { targetType: 'specific_user', userId: userId },
          { targetType: 'specific_role', role: baseMember.role }
        ]
      });

      console.log('🔍 Table permissions found:', tablePermissions.length);

      // If no table permissions are set, show all tables to members
      if (tablePermissions.length === 0) {
        visibleTables = tables;
      } else {
        // Create a map of table permissions
        const tablePermissionMap = {};
        
        // Group permissions by tableId
        const permissionsByTable = {};
        tablePermissions.forEach(perm => {
          if (!permissionsByTable[perm.tableId]) {
            permissionsByTable[perm.tableId] = [];
          }
          permissionsByTable[perm.tableId].push(perm);
        });
        
        // Process each table's permissions with priority order
        Object.keys(permissionsByTable).forEach(tableId => {
          const perms = permissionsByTable[tableId];
          
          // Sort permissions by priority: specific_user > specific_role > all_members
          const sortedPermissions = perms.sort((a, b) => {
            const priority = { 'specific_user': 3, 'specific_role': 2, 'all_members': 1 };
            return (priority[b.targetType] || 0) - (priority[a.targetType] || 0);
          });
          
          // Initialize with default values (hide by default for security)
          tablePermissionMap[tableId] = {
            canView: false, // ✅ Default: hide by default
            isHidden: false
          };
          
          // Check permissions in priority order
          for (const perm of sortedPermissions) {
            if (perm.permissions) {
              if (perm.permissions.canView !== undefined) {
                tablePermissionMap[tableId].canView = perm.permissions.canView;
              }
              if (perm.permissions.isHidden !== undefined) {
                tablePermissionMap[tableId].isHidden = perm.permissions.isHidden;
              }
              // Stop at first permission found (highest priority)
              break;
            }
          }
        });

        // Filter tables - only show tables that user has permission to view
        visibleTables = tables.filter(table => {
          const permissions = tablePermissionMap[table.id];
          if (!permissions) {
            // No permissions set, hide by default (new behavior)
            return false;
          }
          return permissions.canView && !permissions.isHidden;
        });

        console.log('🔍 Tables filtered:', {
          total: tables.length,
          visible: visibleTables.length,
          hidden: tables.length - visibleTables.length
        });
      }
    }

    // Transform to match expected format
    const transformedTables = visibleTables.map(table => ({
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

export const copyTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { name, description, targetDatabaseId } = req.body;
    const userId = req.user?._id?.toString();

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Table name is required' });
    }

    if (!targetDatabaseId) {
      return res.status(400).json({ message: 'Target database ID is required' });
    }

    // Find the original table in PostgreSQL
    const originalTable = await Table.findByPk(tableId);

    if (!originalTable) {
      return res.status(404).json({ message: 'Original table not found' });
    }

    // Check if user is a member of the original database and has permission to copy tables
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: originalTable.database_id, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }

      // Only owner and manager can copy tables
      if (baseMember.role !== 'owner' && baseMember.role !== 'manager') {
        return res.status(403).json({ 
          message: 'Access denied - only database owners and managers can copy tables' 
        });
      }
    }

    // Create new table in PostgreSQL
    const newTable = await Table.create({
      name: name.trim(),
      description: description || originalTable.description,
      database_id: targetDatabaseId,
      user_id: userId,
      site_id: originalTable.site_id,
      table_access_rule: originalTable.table_access_rule,
      column_access_rules: originalTable.column_access_rules,
      record_access_rules: originalTable.record_access_rules,
      cell_access_rules: originalTable.cell_access_rules
    });

    // Copy columns
    const originalColumns = await Column.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });

    const newColumns = [];
    for (const originalColumn of originalColumns) {
      const newColumn = await Column.create({
        name: originalColumn.name,
        key: originalColumn.key,
        type: originalColumn.type,
        data_type: originalColumn.data_type,
        is_required: originalColumn.is_required,
        is_unique: originalColumn.is_unique,
        default_value: originalColumn.default_value,
        order: originalColumn.order,
        table_id: newTable.id,
        user_id: userId,
        site_id: originalTable.site_id,
        checkbox_config: originalColumn.checkbox_config,
        single_select_config: originalColumn.single_select_config,
        multi_select_config: originalColumn.multi_select_config,
        formula_config: originalColumn.formula_config,
        date_config: originalColumn.date_config,
        currency_config: originalColumn.currency_config,
        percent_config: originalColumn.percent_config,
        url_config: originalColumn.url_config,
        phone_config: originalColumn.phone_config,
        time_config: originalColumn.time_config,
        rating_config: originalColumn.rating_config,
        linked_table_config: originalColumn.linked_table_config,
        lookup_config: originalColumn.lookup_config
      });
      newColumns.push(newColumn);
    }

    // Copy records
    const originalRecords = await Record.findAll({
      where: { table_id: tableId }
    });

    const newRecords = [];
    for (const originalRecord of originalRecords) {
      const newRecord = await Record.create({
        data: originalRecord.data,
        table_id: newTable.id,
        user_id: userId,
        site_id: originalTable.site_id
      });
      newRecords.push(newRecord);
    }

    res.status(201).json({
      success: true,
      message: 'Table copied successfully',
      data: {
        table: {
          id: newTable.id,
          name: newTable.name,
          databaseId: newTable.database_id,
          userId: newTable.user_id,
          siteId: newTable.site_id,
          description: newTable.description,
          createdAt: newTable.created_at,
          updatedAt: newTable.updated_at
        },
        columns: newColumns.map(col => ({
          id: col.id,
          name: col.name,
          key: col.key,
          type: col.type,
          dataType: col.data_type,
          isRequired: col.is_required,
          isUnique: col.is_unique,
          defaultValue: col.default_value,
          order: col.order,
          tableId: col.table_id,
          userId: col.user_id,
          siteId: col.site_id,
          createdAt: col.created_at,
          updatedAt: col.updated_at
        })),
        recordsCount: newRecords.length
      }
    });

  } catch (error) {
    console.error('Error copying table:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};