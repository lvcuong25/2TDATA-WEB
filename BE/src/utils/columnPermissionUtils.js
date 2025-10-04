import ColumnPermission from '../model/ColumnPermission.js';
import { Column as PostgresColumn } from '../models/postgres/index.js';
import { isOwner } from './ownerUtils.js';
import { isSuperAdmin } from './permissionUtils.js';

/**
 * Lấy danh sách columns mà user có quyền view
 * @param {string} userId - User ID
 * @param {string} tableId - Table ID
 * @param {string} databaseId - Database ID
 * @param {object} user - User object (optional)
 * @returns {Promise<Array>} - Array of column IDs that user can view
 */
export const getViewableColumns = async (userId, tableId, databaseId, user = null) => {
  try {
    console.log('🔍 getViewableColumns called:', { userId, tableId, databaseId });
    
    // Super admin có quyền xem tất cả columns
    if (user && isSuperAdmin(user)) {
      console.log('✅ User is super admin, can view all columns');
      return null; // null means all columns
    }
    
    // Owner có quyền xem tất cả columns
    const userIsOwner = await isOwner(userId, tableId, databaseId);
    if (userIsOwner) {
      console.log('✅ User is owner, can view all columns');
      return null; // null means all columns
    }
    
    // Lấy tất cả columns của table
    const allColumns = await PostgresColumn.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });
    
    console.log(`🔍 Found ${allColumns.length} columns in table`);
    
    // Lấy tất cả permissions cho các columns này
    const columnIds = allColumns.map(col => col.id);
    const permissions = await ColumnPermission.find({
      columnId: { $in: columnIds }
    });
    
    console.log(`🔍 Found ${permissions.length} column permissions`);
    
    // Lấy role của user trong database
    const mongoose = (await import('mongoose')).default;
    const databaseObjectId = mongoose.Types.ObjectId.isValid(databaseId) 
      ? new mongoose.Types.ObjectId(databaseId) 
      : databaseId;
    
    const BaseMember = (await import('../model/BaseMember.js')).default;
    const baseMember = await BaseMember.findOne({
      userId: userId,
      databaseId: databaseObjectId
    });
    
    if (!baseMember) {
      console.log('❌ User is not a member of this database');
      return []; // No columns viewable
    }
    
    const userRole = baseMember.role;
    console.log(`🔍 User role: ${userRole}`);
    
    // Filter columns based on permissions
    const viewableColumns = [];
    
    console.log(`🔍 Processing ${allColumns.length} columns for user ${userId}`);
    
    for (const column of allColumns) {
      console.log(`🔍 Processing column: ${column.name} (${column.id})`);
      const columnPermissions = permissions.filter(perm => perm.columnId === column.id);
      console.log(`🔍 Found ${columnPermissions.length} permissions for column ${column.name}`);
      
      if (columnPermissions.length === 0) {
        // Không có permission nào = có quyền view (default)
        viewableColumns.push(column.id);
        console.log(`✅ Column ${column.name} (${column.id}): No permissions = can view`);
        continue;
      }
      
      // Sắp xếp permissions theo độ ưu tiên: specific_user > specific_role > all_members
      const sortedPermissions = columnPermissions.sort((a, b) => {
        const priority = { 'specific_user': 3, 'specific_role': 2, 'all_members': 1 };
        return (priority[b.targetType] || 0) - (priority[a.targetType] || 0);
      });
      
      // Lấy permission đầu tiên (ưu tiên cao nhất)
      const topPermission = sortedPermissions[0];
      
      console.log(`🔍 Top permission: targetType=${topPermission.targetType}, userId=${topPermission.userId}, role=${topPermission.role}, canView=${topPermission.canView}`);
      console.log(`🔍 Comparing: topPermission.userId.toString()=${topPermission.userId?.toString() || 'undefined'}, userId=${userId}`);
      
      if (topPermission.targetType === 'specific_user' && topPermission.userId.toString() === userId) {
        // Specific user permission
        console.log(`🔍 Matched specific_user permission for user ${userId}`);
        if (topPermission.canView) {
          viewableColumns.push(column.id);
          console.log(`✅ Column ${column.name} (${column.id}): specific_user permission = can view`);
        } else {
          console.log(`❌ Column ${column.name} (${column.id}): specific_user permission = cannot view`);
        }
      } else if (topPermission.targetType === 'specific_role' && topPermission.role === userRole) {
        // Specific role permission
        if (topPermission.canView) {
          viewableColumns.push(column.id);
          console.log(`✅ Column ${column.name} (${column.id}): specific_role permission = can view`);
        } else {
          console.log(`❌ Column ${column.name} (${column.id}): specific_role permission = cannot view`);
        }
      } else if (topPermission.targetType === 'all_members') {
        // All members permission
        if (topPermission.canView) {
          viewableColumns.push(column.id);
          console.log(`✅ Column ${column.name} (${column.id}): all_members permission = can view`);
        } else {
          console.log(`❌ Column ${column.name} (${column.id}): all_members permission = cannot view`);
        }
      } else {
        // No matching permission = can view (default)
        viewableColumns.push(column.id);
        console.log(`✅ Column ${column.name} (${column.id}): No matching permission = can view`);
      }
    }
    
    console.log(`✅ User can view ${viewableColumns.length}/${allColumns.length} columns`);
    return viewableColumns;
    
  } catch (error) {
    console.error('Error getting viewable columns:', error);
    return []; // Return empty array on error
  }
};

/**
 * Kiểm tra user có quyền edit column không
 * @param {string} userId - User ID
 * @param {string} columnId - Column ID
 * @param {string} tableId - Table ID
 * @param {string} databaseId - Database ID
 * @param {object} user - User object (optional)
 * @returns {Promise<boolean>} - True if user can edit column
 */
export const canUserEditColumn = async (userId, columnId, tableId, databaseId, user = null) => {
  try {
    console.log('🔍 canUserEditColumn called:', { userId, columnId, tableId, databaseId });
    
    // Super admin có quyền edit tất cả columns
    if (user && isSuperAdmin(user)) {
      console.log('✅ User is super admin, can edit all columns');
      return true;
    }
    
    // Owner có quyền edit tất cả columns
    const userIsOwner = await isOwner(userId, tableId, databaseId);
    if (userIsOwner) {
      console.log('✅ User is owner, can edit all columns');
      return true;
    }
    
    // Lấy permissions cho column này
    const permissions = await ColumnPermission.find({
      columnId: columnId
    });
    
    if (permissions.length === 0) {
      // Không có permission nào = có quyền edit (default)
      console.log(`✅ Column ${columnId}: No permissions = can edit`);
      return true;
    }
    
    // Lấy role của user trong database
    const mongoose = (await import('mongoose')).default;
    const databaseObjectId = mongoose.Types.ObjectId.isValid(databaseId) 
      ? new mongoose.Types.ObjectId(databaseId) 
      : databaseId;
    
    const BaseMember = (await import('../model/BaseMember.js')).default;
    const baseMember = await BaseMember.findOne({
      userId: userId,
      databaseId: databaseObjectId
    });
    
    if (!baseMember) {
      console.log('❌ User is not a member of this database');
      return false;
    }
    
    const userRole = baseMember.role;
    console.log(`🔍 User role: ${userRole}`);
    
    // Sắp xếp permissions theo độ ưu tiên: specific_user > specific_role > all_members
    const sortedPermissions = permissions.sort((a, b) => {
      const priority = { 'specific_user': 3, 'specific_role': 2, 'all_members': 1 };
      return (priority[b.targetType] || 0) - (priority[a.targetType] || 0);
    });
    
    // Lấy permission đầu tiên (ưu tiên cao nhất)
    const topPermission = sortedPermissions[0];
    
    if (topPermission.targetType === 'specific_user' && topPermission.userId.toString() === userId) {
      // Specific user permission
      console.log(`🔍 Column ${columnId}: specific_user permission, canEdit: ${topPermission.canEdit}`);
      return topPermission.canEdit;
    } else if (topPermission.targetType === 'specific_role' && topPermission.role === userRole) {
      // Specific role permission
      console.log(`🔍 Column ${columnId}: specific_role permission, canEdit: ${topPermission.canEdit}`);
      return topPermission.canEdit;
    } else if (topPermission.targetType === 'all_members') {
      // All members permission
      console.log(`🔍 Column ${columnId}: all_members permission, canEdit: ${topPermission.canEdit}`);
      return topPermission.canEdit;
    } else {
      // No matching permission = can edit (default)
      console.log(`✅ Column ${columnId}: No matching permission = can edit`);
      return true;
    }
    
  } catch (error) {
    console.error('Error checking column edit permission:', error);
    return false; // Return false on error
  }
};