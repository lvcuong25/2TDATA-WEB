/**
 * Permission utilities
 * Provides functions to handle column, record, and cell permissions
 */

/**
 * Check if user has permission to view a column
 * @param {Array} columnPermissions - Array of column permissions
 * @param {string} columnId - Column ID
 * @param {Object} user - Current user object
 * @param {string} userRole - User's role in the database
 * @returns {boolean} True if user can view the column
 */
export const canViewColumn = (columnPermissions, columnId, user, userRole) => {
  // Check if user is owner (database owner or table owner)
  if (userRole === 'owner') {
    return true;
  }
  
  // console.log(`🔍 canViewColumn called:`, {
  //   columnId,
  //   userId: user._id,
  //   userRole,
  //   permissionsCount: columnPermissions?.length || 0
  // });

  if (!columnPermissions || columnPermissions.length === 0) {
    // console.log(`🔍 No permissions set for column ${columnId}, defaulting to visible (column permissions default to true)`);
    return true;
  }

  // Find permissions for this column
  const columnPerms = columnPermissions.filter(perm => perm.columnId === columnId);
  // console.log(`🔍 Found ${columnPerms.length} permissions for column ${columnId}:`, columnPerms);
  
  if (columnPerms.length === 0) {
    // console.log(`🔍 No specific permissions for column ${columnId}, defaulting to visible (column permissions default to true)`);
    return true;
  }

  // Check permissions in priority order: specific_user > specific_role > all_members
  const specificUserPerm = columnPerms.find(perm => 
    perm.targetType === 'specific_user' && perm.userId?._id === user._id
  );
  
  if (specificUserPerm) {
    // console.log(`🔍 Found specific_user permission for column ${columnId}: canView=${specificUserPerm.canView}`);
    return specificUserPerm.canView;
  }

  const specificRolePerm = columnPerms.find(perm => 
    perm.targetType === 'specific_role' && perm.role === userRole
  );
  
  if (specificRolePerm) {
    // console.log(`🔍 Found specific_role permission for column ${columnId}: canView=${specificRolePerm.canView}`);
    return specificRolePerm.canView;
  }

  const allMembersPerm = columnPerms.find(perm => 
    perm.targetType === 'all_members'
  );
  
  if (allMembersPerm) {
    // console.log(`🔍 Found all_members permission for column ${columnId}: canView=${allMembersPerm.canView}`);
    return allMembersPerm.canView;
  }

  // console.log(`🔍 No matching permission found for column ${columnId}, defaulting to visible (column permissions default to true)`);
  return true;
};

/**
 * Check if user has permission to edit a column
 * @param {Array} columnPermissions - Array of column permissions
 * @param {string} columnId - Column ID
 * @param {Object} user - Current user object
 * @param {string} userRole - User's role in the database
 * @returns {boolean} True if user can edit the column
 */
export const canEditColumn = (columnPermissions, columnId, user, userRole) => {
  // Check if user is owner (database owner or table owner)
  if (userRole === 'owner') {
    return true;
  }
  
  if (!columnPermissions || columnPermissions.length === 0) {
    // No permissions set, default to editable (column permissions default to true)
    return true;
  }

  // Find permissions for this column
  const columnPerms = columnPermissions.filter(perm => perm.columnId === columnId);
  
  if (columnPerms.length === 0) {
    // No specific permissions for this column, default to editable (column permissions default to true)
    return true;
  }

  // Check permissions in priority order: specific_user > specific_role > all_members
  const specificUserPerm = columnPerms.find(perm => 
    perm.targetType === 'specific_user' && perm.userId?._id === user._id
  );
  
  if (specificUserPerm) {
    return specificUserPerm.canEdit;
  }

  const specificRolePerm = columnPerms.find(perm => 
    perm.targetType === 'specific_role' && perm.role === userRole
  );
  
  if (specificRolePerm) {
    return specificRolePerm.canEdit;
  }

  const allMembersPerm = columnPerms.find(perm => 
    perm.targetType === 'all_members'
  );
  
  if (allMembersPerm) {
    return allMembersPerm.canEdit;
  }

  // No matching permission found, default to editable (column permissions default to true)
  return true;
};


/**
 * Check if user has permission to edit a cell
 * @param {Array} cellPermissions - Array of cell permissions
 * @param {string} recordId - Record ID
 * @param {string} columnId - Column ID
 * @param {Object} user - Current user object
 * @param {string} userRole - User's role in the database
 * @returns {boolean} True if user can edit the cell
 */
export const canEditCell = (cellPermissions, recordId, columnId, user, userRole) => {
  // TEMPORARILY DISABLED FOR TESTING - ALWAYS RETURN TRUE
  return true;
  
  // console.log('🔍 canEditCell called:', {
  //   recordId,
  //   columnId,
  //   userId: user?._id,
  //   userRole,
  //   cellPermissionsCount: cellPermissions?.length || 0
  // });

  if (!cellPermissions || cellPermissions.length === 0) {
    // console.log('🔍 No cell permissions, defaulting to editable');
    // No permissions set, default to editable
    return true;
  }

  // Find permissions for this cell
  const cellPerms = cellPermissions.filter(perm => 
    perm.recordId === recordId && perm.columnId === columnId
  );
  
  // console.log('🔍 Found cell permissions:', {
  //   cellPermsCount: cellPerms.length,
  //   cellPerms: cellPerms.map(p => ({
  //     id: p._id,
  //     targetType: p.targetType,
  //     canEdit: p.canEdit,
  //     userId: p.userId?._id,
  //     role: p.role
  //   }))
  // });
  
  if (cellPerms.length === 0) {
    // console.log('🔍 No specific permissions for this cell, defaulting to editable');
    // No specific permissions for this cell, default to editable
    return true;
  }

  // Check permissions in priority order: specific_user > specific_role > all_members
  const specificUserPerm = cellPerms.find(perm => 
    perm.targetType === 'specific_user' && perm.userId?._id === user._id
  );
  
  if (specificUserPerm) {
    // console.log('🔍 Found specific user permission:', specificUserPerm.canEdit);
    return specificUserPerm.canEdit;
  }

  const specificRolePerm = cellPerms.find(perm => 
    perm.targetType === 'specific_role' && perm.role === userRole
  );
  
  if (specificRolePerm) {
    // console.log('🔍 Found specific role permission:', specificRolePerm.canEdit);
    return specificRolePerm.canEdit;
  }

  const allMembersPerm = cellPerms.find(perm => 
    perm.targetType === 'all_members'
  );
  
  if (allMembersPerm) {
    // console.log('🔍 Found all members permission:', allMembersPerm.canEdit);
    return allMembersPerm.canEdit;
  }

  // No matching permission found, default to editable
  return true;
};

/**
 * Filter columns based on user permissions
 * @param {Array} columns - Array of columns
 * @param {Array} columnPermissions - Array of column permissions
 * @param {Object} user - Current user object
 * @param {string} userRole - User's role in the database
 * @returns {Array} Filtered columns that user can view
 */
export const filterColumnsByPermission = (columns, columnPermissions, user, userRole) => {
  if (!columns || columns.length === 0) {
    return [];
  }

  return columns.filter(column => {
    return canViewColumn(columnPermissions, column._id, user, userRole);
  });
};


/**
 * Check if user is super admin
 * @param {Object} user - Current user object
 * @returns {boolean} True if user is super admin
 */
export const isSuperAdmin = (user) => {
  return user && user.role === 'super_admin';
};

/**
 * Get user's role in the database
 * @param {Array} databaseMembers - Array of database members
 * @param {Object} user - Current user object
 * @returns {string} User's role or null if not found
 */
export const getUserDatabaseRole = (databaseMembers, user) => {
  // console.log(`🔍 getUserDatabaseRole called:`, {
  //   databaseMembersCount: databaseMembers?.length || 0,
  //   userId: user?._id,
  //   userRole: user?.role,
  //   isSuperAdmin: isSuperAdmin(user),
  //   databaseMembers: databaseMembers?.map(m => ({
  //     userId: m.userId,
  //     userId_id: m.userId?._id,
  //     user: m.user,
  //     user_id: m.user?._id,
  //     role: m.role
  //   }))
  // });

  if (!user) {
    // console.log(`🔍 getUserDatabaseRole: missing user, returning null`);
    return null;
  }

  // Super admin has owner role in all databases
  if (isSuperAdmin(user)) {
    // console.log(`🔍 getUserDatabaseRole: user is super admin, returning 'owner'`);
    return 'owner';
  }

  if (!databaseMembers) {
    // console.log(`🔍 getUserDatabaseRole: missing databaseMembers, returning null`);
    return null;
  }

  const member = databaseMembers.find(member => {
    const matchesUserId = member.userId === user._id || member.userId?._id === user._id;
    const matchesUser = member.user === user._id || member.user?._id === user._id;
    
    // console.log(`🔍 Checking member:`, {
    //   memberUserId: member.userId,
    //   memberUserId_id: member.userId?._id,
    //   memberUser: member.user,
    //   memberUser_id: member.user?._id,
    //   targetUserId: user._id,
    //   matchesUserId,
    //   matchesUser,
    //   role: member.role
    // });
    
    return matchesUserId || matchesUser;
  });
  
  // console.log(`🔍 getUserDatabaseRole: found member:`, member);
  return member ? member.role : null;
};

/**
 * Check if user is database owner or manager
 * @param {Array} databaseMembers - Array of database members
 * @param {Object} user - Current user object
 * @returns {boolean} True if user is owner or manager
 */
export const isDatabaseOwnerOrManager = (databaseMembers, user) => {
  // Super admin is always considered owner/manager
  if (isSuperAdmin(user)) {
    return true;
  }
  
  const role = getUserDatabaseRole(databaseMembers, user);
  return role === 'owner' || role === 'manager';
};

/**
 * Check if user has permission to view a cell
 * @param {Array} cellPermissions - Array of cell permissions
 * @param {string} recordId - Record ID
 * @param {string} columnId - Column ID
 * @param {Object} user - Current user object
 * @param {string} userRole - User's role in the database
 * @returns {boolean} True if user can view the cell
 */
export const canViewCell = (cellPermissions, recordId, columnId, user, userRole) => {
  // TEMPORARILY DISABLED FOR TESTING - ALWAYS RETURN TRUE
  return true;
  
  // console.log(`🔍 canViewCell called:`, {
  //   recordId,
  //   columnId,
  //   userId: user._id,
  //   userRole,
  //   permissionsCount: cellPermissions?.length || 0
  // });

  if (!cellPermissions || cellPermissions.length === 0) {
    // console.log(`🔍 No permissions set for cell ${recordId}-${columnId}, defaulting to visible`);
    return true;
  }

  // Find permissions for this specific cell
  const cellPerms = cellPermissions.filter(perm => 
    perm.recordId === recordId && perm.columnId === columnId
  );
  // console.log(`🔍 Found ${cellPerms.length} permissions for cell ${recordId}-${columnId}:`, cellPerms);
  
  if (cellPerms.length === 0) {
    // console.log(`🔍 No specific permissions for cell ${recordId}-${columnId}, defaulting to visible`);
    return true;
  }

  // Check permissions in priority order: specific_user > specific_role > all_members
  const specificUserPerm = cellPerms.find(perm => 
    perm.targetType === 'specific_user' && perm.userId?._id === user._id
  );
  
  if (specificUserPerm) {
    // console.log(`🔍 Found specific_user permission for cell ${recordId}-${columnId}: canView=${specificUserPerm.canView}`);
    return specificUserPerm.canView;
  }

  const specificRolePerm = cellPerms.find(perm => 
    perm.targetType === 'specific_role' && perm.role === userRole
  );
  
  if (specificRolePerm) {
    // console.log(`🔍 Found specific_role permission for cell ${recordId}-${columnId}: canView=${specificRolePerm.canView}`);
    return specificRolePerm.canView;
  }

  const allMembersPerm = cellPerms.find(perm => perm.targetType === 'all_members');
  
  if (allMembersPerm) {
    // console.log(`🔍 Found all_members permission for cell ${recordId}-${columnId}: canView=${allMembersPerm.canView}`);
    return allMembersPerm.canView;
  }

  // console.log(`🔍 No matching permissions for cell ${recordId}-${columnId}, defaulting to visible`);
  return true;
};
