import mongoose from 'mongoose';
import TablePermission from '../model/TablePermission.js';
import Table from '../model/Table.js';
import View from '../model/View.js';
import BaseMember from '../model/BaseMember.js';
import User from '../model/User.js';
import Database from '../model/Database.js';
// PostgreSQL imports
import { Table as PostgresTable } from '../models/postgres/index.js';
// Utility imports
import { isOwner as isOwnerUtil } from '../utils/ownerUtils.js';

// Kiểm tra quyền của user trong database
const checkUserRole = async (userId, databaseId) => {
  console.log('🔍 checkUserRole called:', { userId, databaseId, type: typeof databaseId });
  
  // Convert databaseId to ObjectId if it's a string (from PostgreSQL)
  const mongoose = (await import('mongoose')).default;
  const databaseObjectId = mongoose.Types.ObjectId.isValid(databaseId) 
    ? new mongoose.Types.ObjectId(databaseId) 
    : databaseId;
  
  console.log('🔍 Converted databaseId to ObjectId:', databaseObjectId);
  
  const member = await BaseMember.findOne({ 
    databaseId: databaseObjectId, 
    userId 
  });
  
  console.log('🔍 BaseMember found:', member ? 'Yes' : 'No');
  if (member) {
    console.log('🔍 BaseMember role:', member.role);
  }
  
  if (!member) {
    return null;
  }
  
  return member.role;
};

// Kiểm tra user có phải owner không (chỉ owner có quyền mặc định)
const isOwner = async (userId, tableId, databaseId, user) => {
  console.log('🔍 isOwner called:', { 
    userId, 
    tableId,
    databaseId, 
    user: user ? { id: user._id, role: user.role } : 'null' 
  });
  
  // Super admin có quyền truy cập tất cả
  if (user && user.role === 'super_admin') {
    console.log('✅ Super admin detected, returning true');
    return true;
  }
  
  // Use the utility function that handles both database and table owners
  const userIsOwner = await isOwnerUtil(userId, tableId, databaseId);
  console.log('🔍 User is owner (database or table):', userIsOwner);
  return userIsOwner;
};

// Tạo quyền cho table
export const createTablePermission = async (req, res) => {
  try {
    const { tableId } = req.params; // Lấy tableId từ URL params
    const { targetType, userId, role, permissions, viewPermissions, note } = req.body;
    const currentUserId = req.user._id;

    console.log('🔍 createTablePermission - tableId from params:', tableId);
    console.log('🔍 createTablePermission - req.body:', req.body);
    console.log('🔍 createTablePermission - currentUserId:', currentUserId);

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    // Kiểm tra table tồn tại (check MongoDB first since we know table exists there)
    let mongoTable = null;
    let postgresTable = null;
    
    try {
      // Try MongoDB first (we know table exists there from previous test)
      console.log('🔍 createTablePermission - Trying MongoDB with tableId:', tableId);
      mongoTable = await Table.findById(tableId).populate('databaseId');
      console.log('🔍 createTablePermission - MongoDB result:', mongoTable ? 'Found' : 'Not found');
    } catch (error) {
      console.log('🔍 createTablePermission - MongoDB error:', error.message);
    }
    
    if (!mongoTable) {
      try {
        // Try PostgreSQL as fallback
        console.log('🔍 createTablePermission - Trying PostgreSQL with tableId:', tableId);
        postgresTable = await PostgresTable.findByPk(tableId);
        console.log('🔍 createTablePermission - PostgreSQL result:', postgresTable ? 'Found' : 'Not found');
      } catch (error) {
        console.log('🔍 createTablePermission - PostgreSQL error:', error.message);
      }
    }

    const table = mongoTable || postgresTable;
    console.log('🔍 createTablePermission - Table found:', table ? 'Yes' : 'No');
    
    if (!table) {
      console.log('❌ createTablePermission - Table not found in both MongoDB and PostgreSQL');
      return res.status(404).json({ message: 'Table not found' });
    }

    // Get database ID from either source
    let databaseId;
    if (mongoTable) {
      // MongoDB table - get from populated databaseId
      databaseId = mongoTable.databaseId._id;
    } else {
      // PostgreSQL table - database_id is MongoDB ObjectId as string
      databaseId = postgresTable.database_id; // This is MongoDB ObjectId as string
    }
    
    console.log('🔍 createTablePermission - databaseId:', databaseId, 'tableId:', tableId);

    // Kiểm tra user có quyền phân quyền không
    const hasPermission = await isOwner(currentUserId, tableId, databaseId, req.user);
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

    // Kiểm tra quy tắc tạo quyền
    const currentUserRole = await checkUserRole(currentUserId, databaseId);
    console.log('🔍 Current user role:', currentUserRole);

    // Manager không thể tạo quyền cho Owner và Manager khác
    if (currentUserRole === 'manager') {
      if (targetType === 'specific_role' && (role === 'owner' || role === 'manager')) {
        return res.status(403).json({ 
          message: 'Managers cannot create permissions for owners or other managers' 
        });
      }
      
      if (targetType === 'specific_user') {
        const targetUserRole = await checkUserRole(userId, databaseId);
        if (targetUserRole === 'owner' || targetUserRole === 'manager') {
          return res.status(403).json({ 
            message: 'Managers cannot create permissions for owners or other managers' 
          });
        }
      }
    }

    // Owner không thể tạo quyền cho chính mình
    if (currentUserRole === 'owner' && targetType === 'specific_user' && userId === currentUserId.toString()) {
      return res.status(403).json({ 
        message: 'Owners cannot create permissions for themselves' 
      });
    }

    // Kiểm tra xem quyền đã tồn tại chưa (check theo tableId, không phải databaseId)
    let existingPermission = null;
    try {
      if (targetType === 'specific_user') {
        existingPermission = await TablePermission.findOne({
          tableId: tableId, // ✅ ĐÚNG: dùng tableId
          targetType: 'specific_user',
          userId: new mongoose.Types.ObjectId(userId)
        });
      } else if (targetType === 'specific_role') {
        existingPermission = await TablePermission.findOne({
          tableId: tableId, // ✅ ĐÚNG: dùng tableId
          targetType: 'specific_role',
          role: role
        });
      } else if (targetType === 'all_members') {
        existingPermission = await TablePermission.findOne({
          tableId: tableId, // ✅ ĐÚNG: dùng tableId
          targetType: 'all_members'
        });
      }
    } catch (error) {
      console.log('🔍 Error checking existing permission:', error.message);
    }

    if (existingPermission) {
      return res.status(400).json({ 
        message: `Permission already exists for ${targetType === 'specific_user' ? 'this user' : targetType === 'specific_role' ? 'this role' : 'all members'}` 
      });
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
      tableId: tableId, // ✅ Use tableId (can be MongoDB ObjectId or PostgreSQL UUID)
      databaseId: databaseId, // ✅ Use databaseId (MongoDB ObjectId as string)
      targetType,
      name: req.body.name || defaultName,
      permissions: permissions || {},
      viewPermissions: viewPermissions || {},
      createdBy: currentUserId,
      note
    };
    
    console.log('🔍 Creating permission with data:', permissionData);

    // Thêm userId hoặc role tùy theo targetType
    if (targetType === 'specific_user') {
      permissionData.userId = userId;
    } else if (targetType === 'specific_role') {
      permissionData.role = role;
    }

    // Tạo permission trong database
    console.log('🔍 Creating permission for table:', tableId);
    
    // Create permission with proper data types
    const permissionDataFixed = {
      tableId: tableId, // ✅ Use tableId (can be MongoDB ObjectId or PostgreSQL UUID)
      databaseId: new mongoose.Types.ObjectId(databaseId), // ✅ Convert to ObjectId
      targetType,
      name: permissionData.name,
      permissions: permissionData.permissions,
      viewPermissions: permissionData.viewPermissions,
      createdBy: new mongoose.Types.ObjectId(currentUserId),
      isDefault: req.body.isDefault || false,
      note: permissionData.note
    };

    // Add userId or role if needed
    if (targetType === 'specific_user' && userId) {
      permissionDataFixed.userId = new mongoose.Types.ObjectId(userId);
    } else if (targetType === 'specific_role') {
      permissionDataFixed.role = role;
    }

    try {
      const permission = new TablePermission(permissionDataFixed);
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
      console.error('Error creating permission:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error creating permission: ' + error.message 
      });
    }

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

    // Kiểm tra table tồn tại (check PostgreSQL first since we're using UUID tables)
    let postgresTable = null;
    
    try {
      // Try PostgreSQL first (we're using UUID tables)
      console.log('🔍 Trying PostgreSQL with tableId:', tableId);
      postgresTable = await PostgresTable.findByPk(tableId);
      console.log('🔍 PostgreSQL result:', postgresTable ? 'Found' : 'Not found');
    } catch (error) {
      console.log('🔍 PostgreSQL error:', error.message);
    }
    
    if (!postgresTable) {
      console.log('❌ Table not found in PostgreSQL');
      return res.status(404).json({ message: 'Table not found' });
    }

    const table = postgresTable;
    console.log('🔍 Table found:', table ? 'Yes' : 'No');

    // Get database ID from PostgreSQL table
    let databaseId = postgresTable.database_id;

    // Kiểm tra user có phải là member của database không
    const member = await BaseMember.findOne({
      databaseId: databaseId,
      userId: currentUserId
    });
    
    if (!member) {
      return res.status(403).json({ 
        message: 'You are not a member of this database' 
      });
    }
    
    // Chỉ managers và owners mới có thể xem tất cả permissions
    // Members chỉ có thể xem permissions liên quan đến họ
    const isOwner = member.role === 'owner';

    // Lấy tất cả quyền của table
    console.log('🔍 Searching for table permissions for tableId:', tableId);
    
    let permissions = [];
    
    // Now we can search by actual table UUID since we updated the model
    try {
      if (isOwner) {
        // Managers và owners có thể xem tất cả permissions
        permissions = await TablePermission.find({ tableId: tableId })
        .populate('userId', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
      } else {
        // Members chỉ có thể xem permissions liên quan đến họ
        permissions = await TablePermission.find({ 
          tableId: tableId,
          $or: [
            { targetType: 'all_members' },
            { targetType: 'specific_role', role: member.role },
            { targetType: 'specific_user', userId: currentUserId }
          ]
        })
        .populate('userId', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
      }
      
      console.log('🔍 Found permissions for table:', permissions.length);
    } catch (error) {
      console.log('🔍 Error searching permissions:', error.message);
      permissions = [];
    }

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

    console.log('🔍 updateTablePermission - permissionId:', permissionId);
    console.log('🔍 updateTablePermission - currentUserId:', currentUserId);
    console.log('🔍 updateTablePermission - req.body:', req.body);

    if (!permissionId) {
      return res.status(400).json({ message: 'Permission ID is required' });
    }

    // Tìm permission để kiểm tra quyền
    const existingPermission = await TablePermission.findById(permissionId);
    if (!existingPermission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    // Kiểm tra user có quyền cập nhật permission không
    const hasPermission = await isOwner(currentUserId, existingPermission.tableId, existingPermission.databaseId, req.user);
    if (!hasPermission) {
      return res.status(403).json({
        message: 'Only database owners and table owners can update permissions'
      });
    }

    // Cập nhật permission - MERGE thay vì ghi đè
    const updateData = {
      name: name || existingPermission.name,
      note: note !== undefined ? note : existingPermission.note,
      updatedAt: new Date()
    };

    // Merge permissions thay vì ghi đè
    if (permissions) {
      updateData.permissions = {
        ...existingPermission.permissions,
        ...permissions
      };
    }

    // Merge viewPermissions thay vì ghi đè
    if (viewPermissions) {
      updateData.viewPermissions = {
        ...existingPermission.viewPermissions,
        ...viewPermissions
      };
    }

    const updatedPermission = await TablePermission.findByIdAndUpdate(
      permissionId,
      updateData,
      { new: true }
    ).populate([
      { path: 'userId', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Table permission updated successfully',
      data: updatedPermission
    });

  } catch (error) {
    console.error('Error updating table permission:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      permissionId: req.params.permissionId,
      currentUserId: req.user?._id
    });
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Xóa quyền table
export const deleteTablePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const currentUserId = req.user._id;

    console.log('🔍 deleteTablePermission - permissionId:', permissionId);
    console.log('🔍 deleteTablePermission - currentUserId:', currentUserId);

    if (!permissionId) {
      return res.status(400).json({ message: 'Permission ID is required' });
    }

    // Tìm permission để kiểm tra quyền
    const permission = await TablePermission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    // Kiểm tra user có quyền xóa permission không
    const hasPermission = await isOwner(currentUserId, permission.tableId, permission.databaseId, req.user);
    if (!hasPermission) {
      return res.status(403).json({
        message: 'Only database owners and table owners can delete permissions'
      });
    }

    // Xóa permission
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

// Lấy danh sách users/roles có thể tạo quyền (chưa có quyền)
export const getAvailablePermissionTargets = async (req, res) => {
  try {
    const { tableId } = req.params;
    const currentUserId = req.user._id;

    // Lấy databaseId từ table trước
    let databaseId;
    try {
      const postgresTable = await PostgresTable.findByPk(tableId);
      if (postgresTable) {
        databaseId = postgresTable.database_id;
      }
    } catch (error) {
      console.log('🔍 Error getting databaseId:', error.message);
      return res.status(404).json({ message: 'Table not found' });
    }

    // Sau đó mới check user role với databaseId
    const currentUserRole = await checkUserRole(currentUserId, databaseId);
    console.log('🔍 getAvailablePermissionTargets - currentUserRole:', currentUserRole);

    // Lấy tất cả members của database
    const members = await BaseMember.find({ databaseId })
      .populate('userId', 'name email')
      .lean();

    // Lấy tất cả permissions hiện tại cho table cụ thể
    const existingPermissions = await TablePermission.find({
      tableId: tableId // Sử dụng tableId thay vì databaseId
    }).lean();

    // Tạo danh sách users có thể tạo quyền
    const availableUsers = [];
    const availableRoles = ['member']; // Mặc định chỉ có member role

    for (const member of members) {
      const userId = member.userId._id.toString();
      const userRole = member.role;
      const userName = member.userId.name;
      const userEmail = member.userId.email;

      // Kiểm tra quy tắc
      let canCreatePermission = true;
      let reason = '';

      // Manager không thể tạo quyền cho Owner và Manager khác
      if (currentUserRole === 'manager') {
        if (userRole === 'owner' || userRole === 'manager') {
          canCreatePermission = false;
          reason = 'Managers cannot create permissions for owners or other managers';
        }
      }

      // Owner không thể tạo quyền cho chính mình
      if (currentUserRole === 'owner' && userId === currentUserId.toString()) {
        canCreatePermission = false;
        reason = 'Owners cannot create permissions for themselves';
      }

      // Kiểm tra xem đã có quyền chưa
      const hasPermission = existingPermissions.some(perm => 
        perm.targetType === 'specific_user' && 
        perm.userId && 
        perm.userId.toString() === userId
      );

      if (hasPermission) {
        canCreatePermission = false;
        reason = 'Permission already exists for this user';
      }

      if (canCreatePermission) {
        availableUsers.push({
          _id: userId,
          name: userName,
          email: userEmail,
          role: userRole
        });
      }
    }

    // Tạo danh sách roles có thể tạo quyền
    const availableRolesList = [];
    
    // Kiểm tra xem đã có all_members permission chưa
    const hasAllMembersPermission = existingPermissions.some(perm => 
      perm.targetType === 'all_members'
    );
    
    // Cho phép tạo specific_role permissions ngay cả khi đã có all_members
    // Logic ưu tiên: specific_user > specific_role > all_members
    for (const role of availableRoles) {
      // Manager không thể tạo quyền cho owner và manager role
      if (currentUserRole === 'manager' && (role === 'owner' || role === 'manager')) {
        continue;
      }

      // Kiểm tra xem đã có specific_role permission cho role này chưa
      const hasRolePermission = existingPermissions.some(perm => 
        perm.targetType === 'specific_role' && perm.role === role
      );

      if (!hasRolePermission) {
        availableRolesList.push({
          role: role,
          displayName: role.charAt(0).toUpperCase() + role.slice(1)
        });
      }
    }

    // hasAllMembersPermission đã được kiểm tra ở trên

    res.status(200).json({
      success: true,
      data: {
        users: availableUsers,
        roles: availableRolesList,
        canCreateAllMembers: false // all_members permission luôn tồn tại (mặc định)
      }
    });

  } catch (error) {
    console.error('Error getting available permission targets:', error);
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
    console.log('🔍 getDatabaseMembers called:', { 
      databaseId: req.params.databaseId, 
      user: req.user ? { id: req.user._id, role: req.user.role } : 'null' 
    });
    
    const { databaseId } = req.params;
    const currentUserId = req.user?._id;

    if (!databaseId) {
      return res.status(400).json({ message: 'Database ID is required' });
    }

    // Kiểm tra user có quyền xem thành viên không
    // Super admin có quyền truy cập tất cả
    if (req.user && req.user.role === 'super_admin') {
      // Super admin có quyền truy cập tất cả
    } else if (req.user && req.user.role?.includes('super_admin')) {
      // Super admin có quyền truy cập tất cả
    } else if (req.user && req.user.role === 'admin') {
      // Admin có quyền truy cập tất cả
    } else if (req.user && req.user.role === 'site_admin') {
      // Site admin có quyền truy cập tất cả
    } else if (req.user && req.user.role === 'user') {
      // User có quyền truy cập tất cả
    } else {
      const hasPermission = await isOwner(currentUserId, null, databaseId, req.user);
    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Only database managers and owners can view members' 
      });
      }
    }

    // Convert databaseId to ObjectId if it's a string
    const mongoose = (await import('mongoose')).default;
    const databaseObjectId = mongoose.Types.ObjectId.isValid(databaseId) 
      ? new mongoose.Types.ObjectId(databaseId) 
      : databaseId;

    // Lấy tất cả thành viên của database
    const members = await BaseMember.find({ databaseId: databaseObjectId })
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
