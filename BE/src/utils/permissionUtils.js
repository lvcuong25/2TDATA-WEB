import BaseMember from '../model/BaseMember.js';
import BaseRole from '../model/BaseRole.js';

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (user) => {
  return user && user.role === 'super_admin';
};

/**
 * Get user's role in a database
 */
export const getUserDatabaseRole = async (userId, databaseId) => {
  try {
    const member = await BaseMember.findOne({
      userId: userId,
      databaseId: databaseId
    });
    
    if (!member) {
      return null;
    }
    
    // Handle legacy string role field
    if (member.role && !member.roleId) {
      // Return a mock BaseRole-like object for legacy roles
      return {
        name: member.role,
        permissions: {
          canManageMembers: member.role === 'owner' || member.role === 'manager',
          canManageTables: member.role === 'owner' || member.role === 'manager',
          canManageViews: member.role === 'owner' || member.role === 'manager',
          canExportData: true,
          canImportData: member.role === 'owner' || member.role === 'manager'
        }
      };
    }
    
    // Handle new roleId reference
    if (member.roleId) {
      const role = await BaseRole.findById(member.roleId);
      return role;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user database role:', error);
    return null;
  }
};

/**
 * Check if user has access to database
 */
export const hasDatabaseAccess = async (userId, databaseId) => {
  const role = await getUserDatabaseRole(userId, databaseId);
  return role !== null;
};

/**
 * Check if user can manage database (owner or admin)
 */
export const canManageDatabase = async (userId, databaseId) => {
  const role = await getUserDatabaseRole(userId, databaseId);
  return role && (role.name === 'owner' || role.name === 'admin' || role.name === 'manager');
};

export default {
  isSuperAdmin,
  getUserDatabaseRole,
  hasDatabaseAccess,
  canManageDatabase
};
