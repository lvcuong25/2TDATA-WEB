import TablePermission from '../model/TablePermission.js';
import Table from '../model/Table.js';
import View from '../model/View.js';
import BaseMember from '../model/BaseMember.js';
import User from '../model/User.js';
import Database from '../model/Database.js';
// PostgreSQL imports
import { Table as PostgresTable } from '../models/postgres/index.js';

// Kiểm tra quyền của user trong database
const checkUserRole = async (userId, databaseId) => {
  const member = await BaseMember.findOne({ 
    databaseId, 
    userId 
  });
  
  if (!member) {
    return null;
  }
  
  return member.role;
};

// Kiểm tra user có phải manager/owner không
const isManagerOrOwner = async (userId, databaseId) => {
  const role = await checkUserRole(userId, databaseId);
  return role === 'manager' || role === 'owner';
};

// Tạo quyền cho table
export const createTablePermission = async (req, res) => {
  try {
    const { tableId } = req.params; // Lấy tableId từ URL params
    const { targetType, userId, role, permissions, viewPermissions, note } = req.body;
    const currentUserId = req.user._id;

    // console.log('createTablePermission - tableId from params:', tableId);
    // console.log('createTablePermission - req.body:', req.body);
    // console.log('createTablePermission - currentUserId:', currentUserId);

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    // Kiểm tra table tồn tại (check both MongoDB and PostgreSQL)
    const [mongoTable, postgresTable] = await Promise.all([
      Table.findById(tableId).populate('databaseId'),
      PostgresTable.findByPk(tableId)
    ]);

    const table = mongoTable || postgresTable;
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Get database ID from either source
    let databaseId;
    if (mongoTable) {
      databaseId = mongoTable.databaseId._id;
    } else {
      // For PostgreSQL, we need to get the database from MongoDB to find databaseId
      databaseId = postgresTable.database_id;
    }

    // Kiểm tra user có quyền phân quyền không
    const hasPermission = await isManagerOrOwner(currentUserId, databaseId);
    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Only database managers and owners can set permissions' 
      });
    }

    // Validate targetType
    if (!['all_members', 'specific_user', 'specific_role'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type' });
    }

    // Validate specific_user
    if (targetType === 'specific_user' && !userId) {
      return res.status(400).json({ message: 'User ID is required for specific_user target type' });
    }

    // Validate specific_role
    if (targetType === 'specific_role' && !role) {
      return res.status(400).json({ message: 'Role is required for specific_role target type' });
    }

    // Kiểm tra user tồn tại nếu targetType là specific_user
    if (targetType === 'specific_user') {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    // Tạo tên mặc định cho permission
    const defaultName = table.name;

    // Tạo permission object
    const permissionData = {
      tableId,
      databaseId: table.databaseId._id,
      targetType,
      name: req.body.name || defaultName,
      permissions: permissions || {},
      viewPermissions: viewPermissions || {},
      createdBy: currentUserId,
      note
    };

    // Thêm userId hoặc role tùy theo targetType
    if (targetType === 'specific_user') {
      permissionData.userId = userId;
    } else if (targetType === 'specific_role') {
      permissionData.role = role;
    }

    const permission = new TablePermission(permissionData);
    await permission.save();

    // Populate để trả về thông tin đầy đủ
    await permission.populate([
      { path: 'userId', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Table permission created successfully',
      data: permission
    });

  } catch (error) {
    console.error('Error creating table permission:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Permission already exists for this target' 
      });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Lấy danh sách quyền của table
export const getTablePermissions = async (req, res) => {
  try {
    const { tableId } = req.params;
    const currentUserId = req.user._id;

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    // Kiểm tra table tồn tại (check both MongoDB and PostgreSQL)
    const [mongoTable, postgresTable] = await Promise.all([
      Table.findById(tableId).populate('databaseId'),
      PostgresTable.findByPk(tableId)
    ]);

    const table = mongoTable || postgresTable;
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Get database ID from either source
    let databaseId;
    if (mongoTable) {
      databaseId = mongoTable.databaseId._id;
    } else {
      // For PostgreSQL, we need to get the database from MongoDB to find databaseId
      databaseId = postgresTable.database_id;
    }

    // Kiểm tra user có quyền xem quyền không
    const hasPermission = await isManagerOrOwner(currentUserId, databaseId);
    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Only database managers and owners can view permissions' 
      });
    }

    // Lấy tất cả quyền của table
    const permissions = await TablePermission.find({ tableId })
      .populate('userId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: permissions
    });

  } catch (error) {
    console.error('Error fetching table permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cập nhật quyền table
export const updateTablePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { name, permissions, viewPermissions, note } = req.body;
    const currentUserId = req.user._id;

    if (!permissionId) {
      return res.status(400).json({ message: 'Permission ID is required' });
    }

    // Kiểm tra permission tồn tại
    const permission = await TablePermission.findById(permissionId)
      .populate('tableId')
      .populate('databaseId');
    
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    // Kiểm tra user có quyền cập nhật không
    const hasPermission = await isManagerOrOwner(currentUserId, permission.databaseId._id);
    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Only database managers and owners can update permissions' 
      });
    }

    // Cập nhật permission
    if (name !== undefined) {
      permission.name = name;
    }
    if (permissions) {
      permission.permissions = { ...permission.permissions, ...permissions };
    }
    if (viewPermissions) {
      permission.viewPermissions = { ...permission.viewPermissions, ...viewPermissions };
    }
    if (note !== undefined) {
      permission.note = note;
    }

    await permission.save();

    // Populate để trả về thông tin đầy đủ
    await permission.populate([
      { path: 'userId', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Table permission updated successfully',
      data: permission
    });

  } catch (error) {
    console.error('Error updating table permission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Xóa quyền table
export const deleteTablePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const currentUserId = req.user._id;

    // console.log('deleteTablePermission - permissionId:', permissionId);
    // console.log('deleteTablePermission - currentUserId:', currentUserId);

    if (!permissionId) {
      return res.status(400).json({ message: 'Permission ID is required' });
    }

    // Kiểm tra permission tồn tại
    const permission = await TablePermission.findById(permissionId)
      .populate('tableId')
      .populate('databaseId');
    
    // console.log('deleteTablePermission - permission found:', permission);
    
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    // Kiểm tra permission mặc định (không được xóa)
    if (permission.isDefault) {
      return res.status(403).json({ 
        message: 'Cannot delete default permission' 
      });
    }

    // Kiểm tra user có quyền xóa không
    const hasPermission = await isManagerOrOwner(currentUserId, permission.databaseId._id);
    // console.log('deleteTablePermission - hasPermission:', hasPermission);
    // console.log('deleteTablePermission - databaseId:', permission.databaseId._id);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Only database managers and owners can delete permissions' 
      });
    }

    await TablePermission.findByIdAndDelete(permissionId);

    res.status(200).json({
      success: true,
      message: 'Table permission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting table permission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Lấy quyền của user cho table
export const getUserTablePermissions = async (req, res) => {
  try {
    const { tableId } = req.params;
    const currentUserId = req.user._id;

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    // Kiểm tra table tồn tại (check both MongoDB and PostgreSQL)
    const [mongoTable, postgresTable] = await Promise.all([
      Table.findById(tableId).populate('databaseId'),
      PostgresTable.findByPk(tableId)
    ]);

    const table = mongoTable || postgresTable;
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Get database ID from either source
    let databaseId;
    if (mongoTable) {
      databaseId = mongoTable.databaseId._id;
    } else {
      // For PostgreSQL, we need to get the database from MongoDB to find databaseId
      databaseId = postgresTable.database_id;
    }

    // Lấy role của user trong database
    const userRole = await checkUserRole(currentUserId, databaseId);
    if (!userRole) {
      return res.status(403).json({ 
        message: 'You are not a member of this database' 
      });
    }

    // Lấy quyền của user cho table này
    const permissions = await TablePermission.find({
      tableId,
      $or: [
        { targetType: 'all_members' },
        { targetType: 'specific_user', userId: currentUserId },
        { targetType: 'specific_role', role: userRole }
      ]
    });

    // Merge permissions (ưu tiên specific_user > specific_role > all_members)
    let finalPermissions = {
      canView: false,
      canEditStructure: false,
      canEditData: false,
      canAddData: false,
      isHidden: false,
      viewPermissions: {
        canView: false,
        canAddView: false,
        canEditView: false,
        isHidden: false
      }
    };

    // Owner và manager có quyền mặc định
    if (userRole === 'owner' || userRole === 'manager') {
      finalPermissions = {
        canView: true,
        canEditStructure: true,
        canEditData: true,
        canAddData: true,
        isHidden: false,
        viewPermissions: {
          canView: true,
          canAddView: true,
          canEditView: true,
          isHidden: false
        }
      };
    }

    // Áp dụng permissions từ database
    permissions.forEach(permission => {
      if (permission.permissions) {
        Object.keys(permission.permissions).forEach(key => {
          if (permission.permissions[key] !== undefined) {
            finalPermissions[key] = permission.permissions[key];
          }
        });
      }
      if (permission.viewPermissions) {
        Object.keys(permission.viewPermissions).forEach(key => {
          if (permission.viewPermissions[key] !== undefined) {
            finalPermissions.viewPermissions[key] = permission.viewPermissions[key];
          }
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        userRole,
        permissions: finalPermissions
      }
    });

  } catch (error) {
    console.error('Error fetching user table permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Lấy danh sách thành viên database để phân quyền
export const getDatabaseMembers = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const currentUserId = req.user._id;

    if (!databaseId) {
      return res.status(400).json({ message: 'Database ID is required' });
    }

    // Kiểm tra user có quyền xem thành viên không
    const hasPermission = await isManagerOrOwner(currentUserId, databaseId);
    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Only database managers and owners can view members' 
      });
    }

    // Lấy tất cả thành viên của database
    const members = await BaseMember.find({ databaseId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: members
    });

  } catch (error) {
    console.error('Error fetching database members:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
