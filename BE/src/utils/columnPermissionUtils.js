import ColumnPermission from '../model/ColumnPermission.js';
import BaseMember from '../model/BaseMember.js';
import { isSuperAdmin } from './permissionUtils.js';
import { isOwner } from './ownerUtils.js';

/**
 * Kiểm tra user có quyền xem column không
 * @param {string} userId - User ID
 * @param {string} columnId - Column ID
 * @param {string} tableId - Table ID
 * @param {string} databaseId - Database ID
 * @returns {Promise<boolean>} - True nếu user có quyền xem column
 */
export const canUserViewColumn = async (userId, columnId, tableId, databaseId) => {
  try {
    // Super admin có quyền xem tất cả
    if (isSuperAdmin({ role: 'super_admin' })) {
      return true;
    }

    // Kiểm tra user có phải member của database không
    const baseMember = await BaseMember.findOne({
      databaseId: databaseId,
      userId: userId
    });

    if (!baseMember) {
      return false;
    }

    // Owner có quyền mặc định xem tất cả columns
    const userIsOwner = await isOwner(userId, tableId, databaseId);
    if (userIsOwner) {
      return true;
    }

    // Với member/manager, kiểm tra column permissions
    const columnPermissions = await ColumnPermission.find({
      columnId: columnId,
      $or: [
        { targetType: 'all_members' },
        { targetType: 'specific_user', userId: userId },
        { targetType: 'specific_role', role: baseMember.role }
      ]
    });

    // Sort permissions by priority: specific_user > specific_role > all_members
    const sortedPermissions = columnPermissions.sort((a, b) => {
      const priority = { 'specific_user': 3, 'specific_role': 2, 'all_members': 1 };
      return (priority[b.targetType] || 0) - (priority[a.targetType] || 0);
    });

    // Check permissions in priority order
    for (const perm of sortedPermissions) {
      if (perm.canView !== undefined) {
        return perm.canView;
      }
    }

    // Default: nếu không có permission nào được set, cho phép xem (column permissions default to true)
    return true;

  } catch (error) {
    console.error('Error checking canUserViewColumn:', error);
    // Default to true for column permissions
    return true;
  }
};

/**
 * Kiểm tra user có quyền chỉnh sửa column không
 * @param {string} userId - User ID
 * @param {string} columnId - Column ID
 * @param {string} tableId - Table ID
 * @param {string} databaseId - Database ID
 * @returns {Promise<boolean>} - True nếu user có quyền chỉnh sửa column
 */
export const canUserEditColumn = async (userId, columnId, tableId, databaseId) => {
  try {
    // Super admin có quyền chỉnh sửa tất cả
    if (isSuperAdmin({ role: 'super_admin' })) {
      return true;
    }

    // Kiểm tra user có phải member của database không
    const baseMember = await BaseMember.findOne({
      databaseId: databaseId,
      userId: userId
    });

    if (!baseMember) {
      return false;
    }

    // Owner có quyền mặc định chỉnh sửa tất cả columns
    const userIsOwner = await isOwner(userId, tableId, databaseId);
    if (userIsOwner) {
      return true;
    }

    // Với member/manager, kiểm tra column permissions
    const columnPermissions = await ColumnPermission.find({
      columnId: columnId,
      $or: [
        { targetType: 'all_members' },
        { targetType: 'specific_user', userId: userId },
        { targetType: 'specific_role', role: baseMember.role }
      ]
    });

    // Sort permissions by priority: specific_user > specific_role > all_members
    const sortedPermissions = columnPermissions.sort((a, b) => {
      const priority = { 'specific_user': 3, 'specific_role': 2, 'all_members': 1 };
      return (priority[b.targetType] || 0) - (priority[a.targetType] || 0);
    });

    // Check permissions in priority order
    for (const perm of sortedPermissions) {
      if (perm.canEdit !== undefined) {
        return perm.canEdit;
      }
    }

    // Default: nếu không có permission nào được set, cho phép chỉnh sửa (column permissions default to true)
    return true;

  } catch (error) {
    console.error('Error checking canUserEditColumn:', error);
    // Default to true for column permissions
    return true;
  }
};

/**
 * Lấy danh sách columns mà user có quyền xem
 * @param {string} userId - User ID
 * @param {Array} columns - Danh sách columns
 * @param {string} tableId - Table ID
 * @param {string} databaseId - Database ID
 * @returns {Promise<Array>} - Danh sách columns có thể xem
 */
export const getVisibleColumns = async (userId, columns, tableId, databaseId) => {
  try {
    const visibleColumns = [];

    for (const column of columns) {
      const canView = await canUserViewColumn(userId, column.id || column._id, tableId, databaseId);
      if (canView) {
        visibleColumns.push(column);
      }
    }

    return visibleColumns;
  } catch (error) {
    console.error('Error getting visible columns:', error);
    return [];
  }
};
