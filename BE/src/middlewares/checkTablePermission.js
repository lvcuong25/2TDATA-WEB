import TablePermission from '../model/TablePermission.js';
import BaseMember from '../model/BaseMember.js';
import Table from '../model/Table.js';
import { Table as PostgresTable, Column as PostgresColumn, Record as PostgresRecord } from '../models/postgres/index.js';
import { isSuperAdmin } from '../utils/permissionUtils.js';
import { isOwner } from '../utils/ownerUtils.js';

// Kiểm tra quyền của user cho table
export const checkTablePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      console.log('🔍 checkTablePermission middleware called for:', requiredPermission);
      console.log('🔍 req.params:', req.params);
      console.log('🔍 req.body:', req.body);

      // Bypass middleware cho bulk delete route
      if (req.params.recordId === 'bulk') {
        console.log('🔍 Bypassing checkTablePermission for bulk delete');
        return next();
      }

      // Lấy tableId từ params, body, hoặc columnId tùy theo route
      let tableId = req.params.tableId || (req.body && req.body.tableId);
      
      // Require authentication for permission checks
      if (!req.user) {
        console.log('⚠️ No user found, authentication required for permission check');
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required for table permissions' 
        });
      }
      
      const userId = req.user._id;

      // Nếu không có tableId trực tiếp, thử lấy từ columnId (cho routes columns)
      if (!tableId && req.params.columnId) {
        try {
          const column = await PostgresColumn.findByPk(req.params.columnId);
          if (column) {
            tableId = column.table_id;
            console.log('🔍 Got tableId from column:', tableId);
          }
        } catch (error) {
          console.log('🔍 Error getting tableId from column:', error.message);
        }
      }

      // Nếu không có tableId trực tiếp, thử lấy từ recordId (cho routes records)
      if (!tableId && req.params.recordId) {
        try {
          const record = await PostgresRecord.findByPk(req.params.recordId);
          if (record) {
            tableId = record.table_id;
            console.log('🔍 Got tableId from record:', tableId);
          }
        } catch (error) {
          console.log('🔍 Error getting tableId from record:', error.message);
        }
      }

      if (!tableId) {
        return res.status(400).json({ message: 'Table ID is required' });
      }

      // Lấy thông tin table (hỗ trợ cả MongoDB và PostgreSQL)
      let table = null;
      let databaseId = null;
      
      console.log('🔍 checkTablePermission - tableId:', tableId);
      
      try {
        // Thử MongoDB trước
        table = await Table.findById(tableId).populate('databaseId');
        if (table) {
          databaseId = table.databaseId._id;
          console.log('🔍 Found table in MongoDB:', table.name);
        }
      } catch (error) {
        console.log('🔍 Table not found in MongoDB, trying PostgreSQL...', error.message);
      }
      
      if (!table) {
        try {
          // Thử PostgreSQL
          const postgresTable = await PostgresTable.findByPk(tableId);
          if (postgresTable) {
            table = postgresTable;
            databaseId = postgresTable.database_id;
            console.log('🔍 Found table in PostgreSQL:', postgresTable.name);
          }
        } catch (error) {
          console.log('🔍 Table not found in PostgreSQL either:', error.message);
        }
      }
      
      if (!table) {
        console.log('🔍 Table not found in both databases');
        return res.status(404).json({ message: 'Table not found' });
      }

      // Super admin có quyền truy cập tất cả tables, bypass tất cả permission checks
      if (isSuperAdmin(req.user)) {
        console.log('✅ Super admin detected, bypassing all permission checks');
        req.table = table;
        req.member = { role: 'super_admin' }; // Set fake member for compatibility
        return next();
      }

      // Kiểm tra user có phải member của database không
      let member = null;
      try {
        member = await BaseMember.findOne({ 
          databaseId: databaseId, 
          userId 
        });
      } catch (error) {
        console.log('🔍 Error finding BaseMember:', error.message);
        // If BaseMember model is not available, skip permission check for PostgreSQL records
        if (error.message.includes('Schema hasn\'t been registered')) {
          console.log('🔍 BaseMember model not available, skipping permission check for PostgreSQL record');
          req.table = table;
          req.member = { role: 'member' }; // Set default member for compatibility
          return next();
        }
        throw error;
      }
      
      if (!member) {
        // For PostgreSQL records, if no BaseMember found, allow access (fallback)
        console.log('🔍 No BaseMember found, allowing access for PostgreSQL record');
        req.table = table;
        req.member = { role: 'member' }; // Set default member for compatibility
        return next();
      }

      // Kiểm tra user có phải owner (database owner hoặc table owner) không
      const userIsOwner = await isOwner(userId, tableId, databaseId);
      if (userIsOwner) {
        return next(); // Owner có quyền mặc định
      }

      // Lấy quyền của user cho table này theo thứ tự ưu tiên
      let specificUserPermission = null;
      let specificRolePermission = null;
      let allMembersPermission = null;
      
      try {
        // 1. Specific User (ưu tiên cao nhất)
        specificUserPermission = await TablePermission.findOne({
          tableId,
          targetType: 'specific_user',
          userId
        });

        // 2. Specific Role (ưu tiên trung bình)
        specificRolePermission = await TablePermission.findOne({
          tableId,
          targetType: 'specific_role',
          role: member.role
        });

        // 3. All Members (ưu tiên thấp nhất)
        allMembersPermission = await TablePermission.findOne({
          tableId,
          targetType: 'all_members'
        });
      } catch (error) {
        console.log('🔍 Error finding TablePermission:', error.message);
        // If TablePermission model is not available, skip permission check for PostgreSQL records
        if (error.message.includes('Schema hasn\'t been registered')) {
          console.log('🔍 TablePermission model not available, allowing access for PostgreSQL record');
          req.table = table;
          req.member = member;
          return next();
        }
        throw error;
      }

      console.log('🔍 Permission search results:', {
        tableId,
        userId,
        role: member.role,
        specificUserPermission: specificUserPermission ? 'Found' : 'Not found',
        specificRolePermission: specificRolePermission ? 'Found' : 'Not found',
        allMembersPermission: allMembersPermission ? 'Found' : 'Not found'
      });

      // Kiểm tra quyền theo thứ tự ưu tiên
      let hasPermission = false;
      let permissionSource = '';

      // Kiểm tra specific_user trước (ưu tiên cao nhất)
      if (specificUserPermission && specificUserPermission.permissions) {
        // Nếu có specific_user permission, sử dụng nó (dù true hay false)
        hasPermission = specificUserPermission.permissions[requiredPermission] || false;
        permissionSource = 'specific_user';
      }
      // Nếu không có specific_user permission, kiểm tra specific_role
      else if (specificRolePermission && specificRolePermission.permissions) {
        // Nếu có specific_role permission, sử dụng nó (dù true hay false)
        hasPermission = specificRolePermission.permissions[requiredPermission] || false;
        permissionSource = 'specific_role';
      }
      // Nếu không có specific_role permission, kiểm tra all_members
      else if (allMembersPermission && allMembersPermission.permissions) {
        // Nếu có all_members permission, sử dụng nó (dù true hay false)
        hasPermission = allMembersPermission.permissions[requiredPermission] || false;
        permissionSource = 'all_members';
      }

      console.log(`🔍 Permission check for ${requiredPermission}:`, {
        userId,
        role: member.role,
        hasPermission,
        permissionSource,
        specificUser: specificUserPermission ? specificUserPermission.permissions[requiredPermission] : 'none',
        specificRole: specificRolePermission ? specificRolePermission.permissions[requiredPermission] : 'none',
        allMembers: allMembersPermission ? allMembersPermission.permissions[requiredPermission] : 'none'
      });

      // Debug chi tiết từng permission
      if (specificUserPermission) {
        console.log('🔍 Specific User Permission:', {
          _id: specificUserPermission._id,
          permissions: specificUserPermission.permissions,
          [requiredPermission]: specificUserPermission.permissions[requiredPermission]
        });
      }
      if (specificRolePermission) {
        console.log('🔍 Specific Role Permission:', {
          _id: specificRolePermission._id,
          permissions: specificRolePermission.permissions,
          [requiredPermission]: specificRolePermission.permissions[requiredPermission]
        });
      }
      if (allMembersPermission) {
        console.log('🔍 All Members Permission:', {
          _id: allMembersPermission._id,
          permissions: allMembersPermission.permissions,
          [requiredPermission]: allMembersPermission.permissions[requiredPermission]
        });
      }

      if (!hasPermission) {
        return res.status(403).json({ 
          message: `You don't have ${requiredPermission} permission for this table` 
        });
      }

      // Lưu thông tin table và member vào request
      req.table = table;
      req.member = member;
      next();

    } catch (error) {
      console.error('Error checking table permission:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Kiểm tra quyền xem table (bao gồm kiểm tra hidden)
export const checkTableViewPermission = async (req, res, next) => {
  try {
    const { tableId } = req.params;
    
    // Require authentication for permission checks
    if (!req.user) {
      console.log('⚠️ No user found, authentication required for permission check');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required for table view permissions' 
      });
    }
    
    const userId = req.user._id;

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    // Lấy thông tin table (hỗ trợ cả MongoDB và PostgreSQL)
    let table = null;
    let databaseId = null;
    
    try {
      // Thử MongoDB trước
      table = await Table.findById(tableId).populate('databaseId');
      if (table) {
        databaseId = table.databaseId._id;
      }
    } catch (error) {
      console.log('Table not found in MongoDB, trying PostgreSQL...');
    }
    
    if (!table) {
      try {
        // Thử PostgreSQL
        const postgresTable = await PostgresTable.findByPk(tableId);
        if (postgresTable) {
          table = postgresTable;
          databaseId = postgresTable.database_id;
        }
      } catch (error) {
        console.log('Table not found in PostgreSQL either');
      }
    }
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Super admin có quyền truy cập tất cả tables, bypass tất cả permission checks
    if (isSuperAdmin(req.user)) {
      console.log('✅ Super admin detected in checkTableViewPermission, bypassing all permission checks');
      req.table = table;
      req.member = { role: 'super_admin' }; // Set fake member for compatibility
      return next();
    }

    // Kiểm tra user có phải member của database không
    const member = await BaseMember.findOne({ 
      databaseId: databaseId, 
      userId 
    });
    
    if (!member) {
      return res.status(403).json({ 
        message: 'You are not a member of this database' 
      });
    }

    // Owner và manager có quyền mặc định
    if (member.role === 'owner' || member.role === 'manager') {
      req.table = table;
      req.member = member;
      return next();
    }

    // Lấy quyền của user cho table này theo thứ tự ưu tiên
    // 1. Specific User (ưu tiên cao nhất)
    let specificUserPermission = await TablePermission.findOne({
      tableId,
      targetType: 'specific_user',
      userId
    });

    // 2. Specific Role (ưu tiên trung bình)
    let specificRolePermission = await TablePermission.findOne({
      tableId,
      targetType: 'specific_role',
      role: member.role
    });

    // 3. All Members (ưu tiên thấp nhất)
    let allMembersPermission = await TablePermission.findOne({
      tableId,
      targetType: 'all_members'
    });

    // Kiểm tra quyền xem và ẩn theo thứ tự ưu tiên
    let canView = false; // ✅ Default: false (hide by default)
    let isHidden = false;
    let permissionSource = '';

    // Kiểm tra specific_user trước
    if (specificUserPermission && specificUserPermission.permissions) {
      if (specificUserPermission.permissions.canView !== undefined) {
        canView = specificUserPermission.permissions.canView; // ✅ Check both true and false
        permissionSource = 'specific_user';
      }
      if (specificUserPermission.permissions.isHidden) {
        isHidden = true;
      }
    }
    // Nếu không có specific_user, kiểm tra specific_role
    else if (specificRolePermission && specificRolePermission.permissions) {
      if (specificRolePermission.permissions.canView !== undefined) {
        canView = specificRolePermission.permissions.canView; // ✅ Check both true and false
        permissionSource = 'specific_role';
      }
      if (specificRolePermission.permissions.isHidden) {
        isHidden = true;
      }
    }
    // Nếu không có specific_role, kiểm tra all_members
    else if (allMembersPermission && allMembersPermission.permissions) {
      if (allMembersPermission.permissions.canView !== undefined) {
        canView = allMembersPermission.permissions.canView; // ✅ Check both true and false
        permissionSource = 'all_members';
      }
      if (allMembersPermission.permissions.isHidden) {
        isHidden = true;
      }
    }

    console.log(`🔍 View permission check:`, {
      userId,
      role: member.role,
      canView,
      isHidden,
      permissionSource,
      specificUser: specificUserPermission ? specificUserPermission.permissions.canView : 'none',
      specificRole: specificRolePermission ? specificRolePermission.permissions.canView : 'none',
      allMembers: allMembersPermission ? allMembersPermission.permissions.canView : 'none'
    });

    // Nếu table bị ẩn và user không có quyền xem
    if (isHidden && !canView) {
      return res.status(404).json({ 
        message: 'Table not found' // Trả về 404 để ẩn table
      });
    }

    if (!canView) {
      return res.status(403).json({ 
        message: 'You don\'t have view permission for this table' 
      });
    }

    req.table = table;
    req.member = member;
    next();

  } catch (error) {
    console.error('Error checking table view permission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Kiểm tra quyền quản lý (chỉ manager/owner)
export const checkManagementPermission = async (req, res, next) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user._id;

    if (!databaseId) {
      return res.status(400).json({ message: 'Database ID is required' });
    }

    // Kiểm tra user có phải member của database không
    const member = await BaseMember.findOne({ 
      databaseId, 
      userId 
    });
    
    if (!member) {
      return res.status(403).json({ 
        message: 'You are not a member of this database' 
      });
    }

    // Chỉ owner và manager mới có quyền quản lý
    if (member.role !== 'owner' && member.role !== 'manager') {
      return res.status(403).json({ 
        message: 'Only database managers and owners can manage permissions' 
      });
    }

    req.member = member;
    next();

  } catch (error) {
    console.error('Error checking management permission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
