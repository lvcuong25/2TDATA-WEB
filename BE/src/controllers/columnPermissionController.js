import ColumnPermission from '../model/ColumnPermission.js';
import Column from '../model/Column.js';
import Table from '../model/Table.js';
import User from '../model/User.js';
import BaseMember from '../model/BaseMember.js';
import { isSuperAdmin } from '../utils/permissionUtils.js';
// PostgreSQL imports
import { Column as PostgresColumn } from '../models/postgres/index.js';

// Helper function để kiểm tra user có phải manager hoặc owner không
const isManagerOrOwner = async (userId, databaseId) => {
  const baseMember = await BaseMember.findOne({
    userId,
    databaseId
  });
  
  if (!baseMember) return false;
  
  return baseMember.role === 'owner' || baseMember.role === 'manager';
};

// Tạo permission cho column
export const createColumnPermission = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { targetType, userId, role, canView, canEdit, note } = req.body;
    const currentUserId = req.user._id;

    if (!columnId) {
      return res.status(400).json({ message: 'Column ID is required' });
    }

    // Kiểm tra column tồn tại (check both MongoDB and PostgreSQL)
    const [mongoColumn, postgresColumn] = await Promise.all([
      Column.findById(columnId).populate('tableId'),
      PostgresColumn.findByPk(columnId)
    ]);

    const column = mongoColumn || postgresColumn;
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Get database ID from either source
    let databaseId;
    if (mongoColumn) {
      databaseId = mongoColumn.tableId.databaseId;
    } else {
      // For PostgreSQL, we need to get the database from MongoDB to find databaseId
      databaseId = postgresColumn.database_id;
    }

    // Kiểm tra user có quyền set permission không
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
    const defaultName = column.name;

    // Tạo permission object
    const permissionData = {
      columnId,
      tableId: column.tableId._id,
      databaseId: column.tableId.databaseId,
      targetType,
      name: req.body.name || defaultName,
      canView: canView || false,
      canEdit: canEdit || false,
      note: note || '',
      createdBy: currentUserId
    };

    // Thêm userId hoặc role tùy theo targetType
    if (targetType === 'specific_user') {
      permissionData.userId = userId;
    } else if (targetType === 'specific_role') {
      permissionData.role = role;
    }

    const permission = new ColumnPermission(permissionData);
    await permission.save();

    // Populate để trả về đầy đủ thông tin
    await permission.populate([
      { path: 'userId', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      data: permission,
      message: 'Column permission created successfully'
    });

  } catch (error) {
    console.error('Error creating column permission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Lấy tất cả permissions của column
export const getColumnPermissions = async (req, res) => {
  try {
    const { columnId } = req.params;
    const currentUserId = req.user._id;

    if (!columnId) {
      return res.status(400).json({ message: 'Column ID is required' });
    }

    // Kiểm tra column tồn tại (check both MongoDB and PostgreSQL)
    const [mongoColumn, postgresColumn] = await Promise.all([
      Column.findById(columnId).populate('tableId'),
      PostgresColumn.findByPk(columnId)
    ]);

    const column = mongoColumn || postgresColumn;
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Get database ID from either source
    let databaseId;
    if (mongoColumn) {
      databaseId = mongoColumn.tableId.databaseId;
    } else {
      // For PostgreSQL, we need to get the database from MongoDB to find databaseId
      databaseId = postgresColumn.database_id;
    }

    // Kiểm tra user có quyền xem quyền không
    const hasPermission = await isManagerOrOwner(currentUserId, databaseId);
    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Only database managers and owners can view permissions' 
      });
    }

    // Lấy tất cả quyền của column
    const permissions = await ColumnPermission.find({ columnId })
      .populate('userId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: permissions
    });

  } catch (error) {
    console.error('Error getting column permissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Cập nhật permission
export const updateColumnPermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { name, canView, canEdit, note } = req.body;
    const currentUserId = req.user._id;

    if (!permissionId) {
      return res.status(400).json({ message: 'Permission ID is required' });
    }

    // Kiểm tra permission tồn tại
    const permission = await ColumnPermission.findById(permissionId)
      .populate('columnId')
      .populate('tableId');
    
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    // Kiểm tra user có quyền cập nhật không
    const hasPermission = await isManagerOrOwner(currentUserId, permission.databaseId);
    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Only database managers and owners can update permissions' 
      });
    }

    // Cập nhật permission
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (canView !== undefined) updateData.canView = canView;
    if (canEdit !== undefined) updateData.canEdit = canEdit;
    if (note !== undefined) updateData.note = note;

    const updatedPermission = await ColumnPermission.findByIdAndUpdate(
      permissionId,
      updateData,
      { new: true }
    ).populate([
      { path: 'userId', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      data: updatedPermission,
      message: 'Column permission updated successfully'
    });

  } catch (error) {
    console.error('Error updating column permission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Xóa permission
export const deleteColumnPermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const currentUserId = req.user._id;

    if (!permissionId) {
      return res.status(400).json({ message: 'Permission ID is required' });
    }

    // Kiểm tra permission tồn tại
    const permission = await ColumnPermission.findById(permissionId)
      .populate('columnId')
      .populate('tableId');
    
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
    const hasPermission = await isManagerOrOwner(currentUserId, permission.databaseId);
    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Only database managers and owners can delete permissions' 
      });
    }

    await ColumnPermission.findByIdAndDelete(permissionId);

    res.status(200).json({
      success: true,
      message: 'Column permission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting column permission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Lấy quyền của user cho column
export const getUserColumnPermission = async (req, res) => {
  try {
    const { columnId } = req.params;
    const currentUserId = req.user._id;

    if (!columnId) {
      return res.status(400).json({ message: 'Column ID is required' });
    }

    // Kiểm tra column tồn tại
    const column = await Column.findById(columnId).populate('tableId');
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Lấy role của user trong database
    const baseMember = await BaseMember.findOne({
      userId: currentUserId,
      databaseId: column.tableId.databaseId
    });

    if (!baseMember) {
      return res.status(403).json({ message: 'You are not a member of this database' });
    }

    const userRole = baseMember.role;

    // Lấy quyền của user cho column này
    const permissions = await ColumnPermission.find({
      columnId,
      $or: [
        { targetType: 'all_members' },
        { targetType: 'specific_user', userId: currentUserId },
        { targetType: 'specific_role', role: userRole }
      ]
    });

    // Merge permissions (ưu tiên specific_user > specific_role > all_members)
    let finalPermissions = {
      canView: false,
      canEdit: false
    };

    // Owner và manager có quyền mặc định
    if (userRole === 'owner' || userRole === 'manager') {
      finalPermissions = {
        canView: true,
        canEdit: true
      };
    } else {
      // Sắp xếp permissions theo độ ưu tiên
      const sortedPermissions = permissions.sort((a, b) => {
        const priority = { 'specific_user': 3, 'specific_role': 2, 'all_members': 1 };
        return (priority[b.targetType] || 0) - (priority[a.targetType] || 0);
      });

      // Lấy quyền đầu tiên (ưu tiên cao nhất)
      for (const perm of sortedPermissions) {
        if (perm.canView !== undefined) {
          finalPermissions.canView = perm.canView;
        }
        if (perm.canEdit !== undefined) {
          finalPermissions.canEdit = perm.canEdit;
        }
        if (finalPermissions.canView !== undefined && finalPermissions.canEdit !== undefined) {
          break;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: finalPermissions
    });

  } catch (error) {
    console.error('Error getting user column permission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Lấy tất cả permissions của tất cả columns trong một table
export const getTableColumnPermissions = async (req, res) => {
  try {
    const { tableId } = req.params;
    const currentUserId = req.user._id;

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    // Kiểm tra table tồn tại (using PostgreSQL)
    const { Table: PostgresTable } = await import('../models/postgres/index.js');
    const table = await PostgresTable.findByPk(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Super admin có quyền truy cập tất cả database
    if (!isSuperAdmin(req.user)) {
      // Kiểm tra user có quyền xem quyền không (cho phép member cũng xem)
      const baseMember = await BaseMember.findOne({
        userId: currentUserId,
        databaseId: table.databaseId
      });
      
      if (!baseMember) {
        return res.status(403).json({ 
          message: 'Access denied - you are not a member of this database' 
        });
      }
    }

    // Lấy tất cả columns của table từ cả MongoDB và PostgreSQL
    const { Column: PostgresColumn } = await import('../models/postgres/index.js');
    
    const [mongoColumns, postgresColumns] = await Promise.all([
      Column.find({ tableId }),
      PostgresColumn.findAll({ where: { table_id: tableId } })
    ]);
    
    // Combine column IDs from both sources
    const mongoColumnIds = mongoColumns.map(col => col._id);
    const postgresColumnIds = postgresColumns.map(col => col.id);
    const allColumnIds = [...mongoColumnIds, ...postgresColumnIds];

    // Lấy tất cả quyền của tất cả columns trong table
    const permissions = await ColumnPermission.find({ 
      columnId: { $in: allColumnIds } 
    })
      .populate('userId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: permissions,
      message: 'Table column permissions retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting table column permissions:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};
