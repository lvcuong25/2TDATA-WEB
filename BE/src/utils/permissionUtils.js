import BaseMember from '../model/BaseMember.js';

/**
 * Kiểm tra user có phải super_admin không
 * @param {Object} user - User object từ req.user
 * @returns {boolean}
 */
export const isSuperAdmin = (user) => {
  return user && user.role === 'super_admin';
};

/**
 * Kiểm tra user có quyền truy cập database không (bao gồm super_admin)
 * @param {string} userId - User ID
 * @param {string} databaseId - Database ID
 * @returns {Promise<boolean>}
 */
export const hasDatabaseAccess = async (userId, databaseId) => {
  // Super admin có quyền truy cập tất cả database
  const user = await import('../model/User.js').then(m => m.default.findById(userId));
  if (isSuperAdmin(user)) {
    return true;
  }

  // Kiểm tra membership thông thường
  const member = await BaseMember.findOne({
    databaseId,
    userId
  });
  
  return !!member;
};

/**
 * Lấy role của user trong database (bao gồm super_admin)
 * @param {string} userId - User ID
 * @param {string} databaseId - Database ID
 * @returns {Promise<string|null>}
 */
export const getUserDatabaseRole = async (userId, databaseId) => {
  // Super admin có quyền owner trong tất cả database
  const user = await import('../model/User.js').then(m => m.default.findById(userId));
  if (isSuperAdmin(user)) {
    return 'owner';
  }

  // Kiểm tra membership thông thường
  const member = await BaseMember.findOne({
    databaseId,
    userId
  });
  
  return member ? member.role : null;
};

/**
 * Kiểm tra user có quyền quản lý database không (owner, manager, hoặc super_admin)
 * @param {string} userId - User ID
 * @param {string} databaseId - Database ID
 * @returns {Promise<boolean>}
 */
export const canManageDatabase = async (userId, databaseId) => {
  const role = await getUserDatabaseRole(userId, databaseId);
  return role === 'owner' || role === 'manager';
};

/**
 * Kiểm tra user có quyền chỉnh sửa database không (owner hoặc super_admin)
 * @param {string} userId - User ID
 * @param {string} databaseId - Database ID
 * @returns {Promise<boolean>}
 */
export const canEditDatabase = async (userId, databaseId) => {
  const role = await getUserDatabaseRole(userId, databaseId);
  return role === 'owner';
};
