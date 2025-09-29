import Table from '../model/Table.js';
import Column from '../model/Column.js';
import Record from '../model/Record.js';
import Database from '../model/Database.js';
import Base from '../model/Base.js';
import BaseMember from '../model/BaseMember.js';
import Organization from '../model/Organization.js';
import { isSuperAdmin, getUserDatabaseRole } from '../utils/permissionUtils.js';
import { createMetabaseTable } from '../utils/metabaseTableCreator.js';
// PostgreSQL imports
import { Table as PostgresTable, Column as PostgresColumn, Record as PostgresRecord } from '../models/postgres/index.js';

// Table Controllers
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
    // Super admin có quyền tạo table trong mọi database
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
        return res.status(403).json({ 
          message: 'Access denied - only database owners and managers can create tables' 
        });
      }
    }

    // Check if table exists in PostgreSQL
    const existingTable = await PostgresTable.findOne({
      where: {
        name: name.trim(),
        database_id: actualBaseId
      }
    });

    if (existingTable) {
      return res.status(400).json({ message: 'Table with this name already exists in this base' });
    }

    // Create table in PostgreSQL
    const table = await PostgresTable.create({
      name: name.trim(),
      description: description || '',
      database_id: actualBaseId,
      user_id: userId,
      site_id: req.siteId?.toString(),
      table_access_rule: {
        userIds: [],
        allUsers: false,
        access: []
      },
      column_access_rules: [],
      record_access_rules: [],
      cell_access_rules: []
    });

    console.log(`✅ Table created in PostgreSQL: ${table.name} (${table.id})`);

    // Tạo default permissions cho tất cả members
    try {
      const TablePermission = (await import('../model/TablePermission.js')).default;
      const defaultPermission = new TablePermission({
        tableId: table._id,
        databaseId: actualBaseId,
        targetType: 'all_members',
        name: table.name, // Thêm field name required
        permissions: {
          canView: true,
          canEditStructure: true,
          canEditData: true,
          canAddData: true
        },
        viewPermissions: {
          canView: true,
          canAddView: true,
          canEditView: true
        },
        createdBy: userId,
        isDefault: true // Đánh dấu là permission mặc định
      });

      await defaultPermission.save();
      // console.log('Default table permission created successfully');
    } catch (permissionError) {
      console.error('Error creating default table permission:', permissionError);
      // Không throw error để không ảnh hưởng đến việc tạo table
    }

    // Tạo Metabase table tự động
    try {
      console.log(`🎯 Creating Metabase table for: ${table.name} (${table.id})`);
      console.log('📋 Table object:', JSON.stringify(table, null, 2));
      
      const metabaseResult = await createMetabaseTable(table.id, table.name, base.organizationId?.toString());
      console.log('🎯 Metabase result:', metabaseResult);
      
      if (metabaseResult.success) {
        console.log(`✅ Metabase table created: ${metabaseResult.metabaseTableName}`);
      } else {
        console.error(`❌ Failed to create Metabase table: ${metabaseResult.error}`);
      }
    } catch (metabaseError) {
      console.error('❌ Error creating Metabase table:', metabaseError);
      console.error('❌ Error stack:', metabaseError.stack);
      // Không throw error để không ảnh hưởng đến việc tạo table
    }

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: {
        _id: table.id,
        name: table.name,
        description: table.description,
        databaseId: table.database_id,
        userId: table.user_id,
        siteId: table.site_id,
        createdAt: table.created_at,
        updatedAt: table.updated_at
      }
    });
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTables = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user?._id?.toString();

    if (!databaseId) {
      return res.status(400).json({ message: "Database ID is required" });
    }

    // Get database to find orgId directly
    const database = await Database.findById(databaseId);
    
    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }

    // Super admin có quyền truy cập tất cả database
    if (!isSuperAdmin(req.user)) {
      // Check if user is a member of this database (either through organization or direct database membership)
      const baseMember = await BaseMember.findOne({ 
        databaseId: databaseId, 
        userId 
      });

      if (!baseMember) {
        // If not a direct database member, check if user is organization member
        const organization = await Organization.findOne({ 
          _id: database.orgId,
          'members.user': userId 
        });
        
        if (!organization) {
          return res.status(403).json({ message: "Access denied - user is not a member of this database" });
        }
      }
    }

    // Get tables from both MongoDB and PostgreSQL
    const [mongoTables, postgresTables] = await Promise.all([
      Table.find({ databaseId: databaseId }).sort({ createdAt: -1 }),
      PostgresTable.findAll({
        where: { database_id: databaseId },
        order: [['created_at', 'DESC']]
      })
    ]);

    // Transform PostgreSQL tables to match MongoDB format
    const transformedPostgresTables = postgresTables.map(table => ({
      _id: table.id,
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

    // Combine tables from both sources
    const allTables = [...mongoTables, ...transformedPostgresTables];

    // Remove duplicates based on name (PostgreSQL takes precedence)
    const uniqueTables = allTables.reduce((acc, current) => {
      const existingIndex = acc.findIndex(table => table.name === current.name);
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        // Replace with PostgreSQL version if it exists
        if (current._id && !acc[existingIndex]._id.toString().includes('-')) {
          acc[existingIndex] = current;
        }
      }
      return acc;
    }, []);

    // Sort by creation date
    const tables = uniqueTables.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Filter tables based on user permissions
    let visibleTables = tables;
    
    // Super admin có quyền xem tất cả table, không cần filter
    if (!isSuperAdmin(req.user)) {
      // Get baseMember for permission checking
      const baseMember = await BaseMember.findOne({ 
        databaseId: databaseId, 
        userId 
      });
      
      // Only apply permission filtering for members
      if (baseMember && baseMember.role === 'member') {
      // For members, check table permissions
      const TablePermission = (await import('../model/TablePermission.js')).default;
      
      const tablePermissions = await TablePermission.find({
        tableId: { $in: tables.map(t => t._id) },
        $or: [
          { targetType: 'all_members' },
          { targetType: 'specific_user', userId: userId },
          { targetType: 'specific_role', role: baseMember.role }
        ]
      });

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
          
          // Initialize with default values (show by default)
          tablePermissionMap[tableId] = {
            canView: true,
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

        // Filter tables - only hide tables that are explicitly hidden or cannot be viewed
        visibleTables = tables.filter(table => {
          const permissions = tablePermissionMap[table._id];
          if (!permissions) {
            // No permissions set, show by default
            return true;
          }
          return permissions.canView && !permissions.isHidden;
        });
      }
    }
    } // End of super admin check
    // For owners and managers, show all tables

    // Transform PostgreSQL data to match frontend expected format
    const transformedTables = visibleTables.map(table => ({
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
    }));

    res.status(200).json({
      success: true,
      data: transformedTables
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTableById = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user?._id?.toString();
    const siteId = req.siteId?.toString();

    const table = await PostgresTable.findOne({
      where: {
        id: tableId,
        user_id: userId,
        site_id: siteId
      }
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.status(200).json({
      success: true,
      data: {
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
      }
    });
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { name, description } = req.body;
    const userId = req.user?._id?.toString();

    const table = await Table.findOne({
      _id: tableId
    }).populate('databaseId');

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user is a member of this database and has permission to update tables
    // Super admin có quyền update table trong mọi database
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: table.databaseId._id, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }

      // Only owner and manager can update tables
      if (baseMember.role !== 'owner' && baseMember.role !== 'manager') {
        return res.status(403).json({ 
          message: 'Access denied - only database owners and managers can update tables' 
        });
      }
    }

    if (name && name.trim() !== '') {
      const existingTable = await Table.findOne({
        name: name.trim(),
        databaseId: table.databaseId._id,
        _id: { $ne: tableId }
      });

      if (existingTable) {
        return res.status(400).json({ message: 'Table with this name already exists in this database' });
      }

      table.name = name.trim();
    }

    if (description !== undefined) {
      table.description = description;
    }

    await table.save();

    res.status(200).json({
      success: true,
      message: 'Table updated successfully',
      data: table
    });
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user?._id?.toString();

    // Use PostgreSQL Table model instead of MongoDB
    const table = await PostgresTable.findByPk(tableId);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user owns this table or is super admin
    if (!req.user || (!isSuperAdmin(req.user) && table.user_id !== userId)) {
      return res.status(403).json({ 
        message: 'Access denied - you can only delete your own tables' 
      });
    }

    // Delete all related data (columns, records) from PostgreSQL
    await PostgresColumn.destroy({ where: { table_id: tableId } });
    await PostgresRecord.destroy({ where: { table_id: tableId } });
    await table.destroy();

    res.status(200).json({
      success: true,
      message: 'Table and all its data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ message: 'Internal server error' });
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

    // Find the original table
    const originalTable = await Table.findOne({
      _id: tableId
    }).populate('databaseId');

    if (!originalTable) {
      return res.status(404).json({ message: 'Original table not found' });
    }

    // Check if user is a member of the original database and has permission to copy tables
    // Super admin có quyền copy table trong mọi database
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: originalTable.databaseId._id, 
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

      // Verify target database exists and user has access to it
      const targetDatabase = await Database.findById(targetDatabaseId);
      
      if (!targetDatabase) {
        return res.status(404).json({ message: 'Target database not found' });
      }

      // Check if user is a member of the target database
      const targetBaseMember = await BaseMember.findOne({ 
        databaseId: targetDatabaseId, 
        userId 
      });

      if (!targetBaseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of the target database' });
      }
    } else {
      // For super admin, just verify target database exists
      const targetDatabase = await Database.findById(targetDatabaseId);
      
      if (!targetDatabase) {
        return res.status(404).json({ message: 'Target database not found' });
      }
    }

    // Check if table with new name already exists in target database
    const existingTable = await Table.findOne({
      name: name.trim(),
      databaseId: targetDatabaseId
    });

    if (existingTable) {
      return res.status(400).json({ message: 'Table with this name already exists in the target database' });
    }

    // Create new table
    const newTable = new Table({
      name: name.trim(),
      description: description || originalTable.description || '',
      databaseId: targetDatabaseId,
      userId
    });

    await newTable.save();

    // Get all columns from original table
    const originalColumns = await Column.find({ tableId: originalTable._id });

    // Create mapping for old to new column IDs (for formula references)
    const columnIdMapping = {};

    // Copy all columns FIRST
    for (const originalColumn of originalColumns) {
      const newColumn = new Column({
        name: originalColumn.name,
        key: originalColumn.key || `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dataType: originalColumn.dataType,
        isRequired: originalColumn.isRequired,
        defaultValue: originalColumn.defaultValue,
        description: originalColumn.description || '',
        tableId: newTable._id,
        databaseId: targetDatabaseId,
        userId,
        // Copy lookup and linked table configurations
        lookupTableId: originalColumn.lookupTableId,
        lookupColumnId: originalColumn.lookupColumnId,
        linkedTableId: originalColumn.linkedTableId,
        linkedColumnId: originalColumn.linkedColumnId,
        displayColumnId: originalColumn.displayColumnId,
        // Copy other column properties
        isUnique: originalColumn.isUnique,
        isIndexed: originalColumn.isIndexed,
        validationRules: originalColumn.validationRules,
        options: originalColumn.options,
        // IMPORTANT: Copy formula configuration
        formulaConfig: originalColumn.formulaConfig,
        // Copy additional properties that might exist
        format: originalColumn.format,
        precision: originalColumn.precision,
        min: originalColumn.min,
        max: originalColumn.max,
        step: originalColumn.step,
        width: originalColumn.width,
        order: originalColumn.order
      });

      await newColumn.save();
      
      // Store mapping for formula references
      columnIdMapping[originalColumn._id.toString()] = newColumn._id.toString();
    }

    // Now copy all records ONCE (outside the column loop)
    const originalRecords = await Record.find({ tableId: originalTable._id });

    for (const originalRecord of originalRecords) {
      const newRecord = new Record({
        data: originalRecord.data,
        tableId: newTable._id,
        userId,
        siteId: req.user.site_id
      });

      await newRecord.save();
    }

    // Tạo default permissions cho table mới
    try {
      const TablePermission = (await import('../model/TablePermission.js')).default;
      const defaultPermission = new TablePermission({
        tableId: newTable._id,
        databaseId: targetDatabaseId,
        targetType: 'all_members',
        name: newTable.name, // Thêm field name required
        permissions: {
          canView: true,
          canEditStructure: true,
          canEditData: true,
          canAddData: true
        },
        viewPermissions: {
          canView: true,
          canAddView: true,
          canEditView: true
        },
        createdBy: userId,
        isDefault: true
      });

      await defaultPermission.save();
      // console.log('Default table permission created successfully for copied table');
    } catch (permissionError) {
      console.error('Error creating default table permission for copied table:', permissionError);
      // Không throw error để không ảnh hưởng đến việc copy table
    }

    res.status(201).json({
      success: true,
      message: 'Table copied successfully with all columns and formulas',
      data: newTable
    });
  } catch (error) {
    console.error('Error copying table:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

