import { Table as PostgresTable, Column as PostgresColumn, Record as PostgresRecord } from '../models/postgres/index.js';
import { isSuperAdmin } from '../utils/permissionUtils.js';

// Simple Table Controllers that bypass MongoDB permission checks for testing
export const createTableSimple = async (req, res) => {
  try {
    const { baseId, databaseId, name, description } = req.body;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962'; // Convert ObjectId to string

    console.log('🔍 Debug createTableSimple:');
    console.log('   req.siteId:', req.siteId, typeof req.siteId);
    console.log('   req.body:', req.body);

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Table name is required' });
    }

    const actualBaseId = baseId || databaseId;
    
    if (!actualBaseId) {
      return res.status(400).json({ message: 'Base ID is required' });
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
      site_id: req.siteId?.toString() || '686d45a89a0a0c37366567c8', // Convert ObjectId to string
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
      const mongoose = (await import('mongoose')).default;
      
      const defaultPermission = new TablePermission({
        tableId: table.id, // Use actual table UUID
        databaseId: new mongoose.Types.ObjectId(actualBaseId), // Convert to ObjectId
        targetType: 'all_members',
        name: table.name, // Thêm field name required
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
        note: 'Default permission created automatically when table was created (simple)'
      });

      await defaultPermission.save();
      console.log('✅ Default table permission created successfully (simple)');
    } catch (permissionError) {
      console.error('❌ Error creating default table permission (simple):', permissionError);
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
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getTablesSimple = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962'; // Convert ObjectId to string

    if (!databaseId) {
      return res.status(400).json({ message: "Database ID is required" });
    }

    // Import required models
    const BaseMember = (await import('../model/BaseMember.js')).default;
    const TablePermission = (await import('../model/TablePermission.js')).default;

    // Check if user has access to this database
    let baseMember = null;
    if (!isSuperAdmin(req.user)) {
      baseMember = await BaseMember.findOne({ 
        databaseId: databaseId, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }
    }

    // Get tables from PostgreSQL
    const tables = await PostgresTable.findAll({
      where: { database_id: databaseId },
      order: [['created_at', 'DESC']]
    });

    let visibleTables = tables;

    // Check table permissions for members and managers (database owners and table owners see all tables)
    const isDatabaseOwner = baseMember && baseMember.role === 'owner';
    const isTableOwner = tables.some(table => table.user_id && table.user_id.toString() === userId.toString());
    
    if (!isSuperAdmin(req.user) && baseMember && !isDatabaseOwner && !isTableOwner && (baseMember.role === 'member' || baseMember.role === 'manager')) {
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

      // If no table permissions are set, hide all tables by default
      if (tablePermissions.length === 0) {
        visibleTables = [];
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
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
