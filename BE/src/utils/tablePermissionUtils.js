import TablePermission from '../model/TablePermission.js';
import BaseMember from '../model/BaseMember.js';
import { isSuperAdmin } from './permissionUtils.js';
import { isOwner } from './ownerUtils.js';

/**
 * Kiểm tra user có quyền xem tất cả records trong table không
 * @param {string} userId - User ID
 * @param {string} tableId - Table ID
 * @param {string} databaseId - Database ID
 * @param {Object} user - User object (optional, for super admin check)
 * @returns {Promise<boolean>} - True nếu user có quyền xem tất cả records
 */
export const canUserViewAllRecords = async (userId, tableId, databaseId, user = null) => {
  try {
    // Super admin có quyền xem tất cả
    if (user && isSuperAdmin(user)) {
      return true;
    }

    // Kiểm tra user có phải owner (database owner hoặc table owner) không
    // Check owner status first, before checking baseMember (to avoid MongoDB timeout issues)
    const userIsOwner = await isOwner(userId, tableId, databaseId);
    if (userIsOwner) {
      return true; // Owner có quyền xem tất cả records
    }

    // Kiểm tra user có phải member của database không
    const baseMember = await BaseMember.findOne({
      databaseId: databaseId,
      userId: userId
    });

    if (!baseMember) {
      return false;
    }

    // Với member, kiểm tra table permissions
    const tablePermissions = await TablePermission.find({
      tableId: tableId,
      $or: [
        { targetType: 'all_members' },
        { targetType: 'specific_user', userId: userId },
        { targetType: 'specific_role', role: baseMember.role }
      ]
    });

    // Sort permissions by priority: specific_user > specific_role > all_members
    const sortedPermissions = tablePermissions.sort((a, b) => {
      const priority = { 'specific_user': 3, 'specific_role': 2, 'all_members': 1 };
      return (priority[b.targetType] || 0) - (priority[a.targetType] || 0);
    });

    // Check permissions in priority order
    for (const perm of sortedPermissions) {
      if (perm.permissions && perm.permissions.canViewAllRecords !== undefined) {
        return perm.permissions.canViewAllRecords;
      }
    }

    // Default: nếu không có permission nào được set, chỉ xem records của mình
    return false;

  } catch (error) {
    console.error('Error checking canUserViewAllRecords:', error);
    // Default to false for security
    return false;
  }
};

/**
 * Lấy filter condition để filter records dựa trên quyền xem
 * @param {string} userId - User ID
 * @param {string} tableId - Table ID
 * @param {string} databaseId - Database ID
 * @returns {Promise<Object>} - Filter condition cho database query
 */
export const getRecordViewFilter = async (userId, tableId, databaseId, user = null) => {
  try {
    const canViewAll = await canUserViewAllRecords(userId, tableId, databaseId, user);
    
    if (canViewAll) {
      // Có thể xem tất cả records
      return {};
    } else {
      // Chỉ có thể xem records do mình tạo
      return { user_id: userId };
    }
  } catch (error) {
    console.error('Error getting record view filter:', error);
    // Default to showing only own records for safety
    return { user_id: userId };
  }
};
