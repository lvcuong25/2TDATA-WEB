// Role hierarchy utilities
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SITE_ADMIN: 'site_admin', 
  SITE_MODERATOR: 'site_moderator',
  MEMBER: 'member'
};

// Role hierarchy levels (higher number = higher authority)
export const ROLE_LEVELS = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.SITE_ADMIN]: 80,
  [ROLES.SITE_MODERATOR]: 60,
  [ROLES.MEMBER]: 40
};

/**
 * Check if a user can assign a specific role to another user
 * @param {string} assignerRole - Role of the user assigning the role
 * @param {string} targetRole - Role being assigned
 * @returns {boolean}
 */
export const canAssignRole = (assignerRole, targetRole) => {
  const assignerLevel = ROLE_LEVELS[assignerRole] || 0;
  const targetLevel = ROLE_LEVELS[targetRole] || 0;
  
  // Can only assign roles lower than your own
  return assignerLevel > targetLevel;
};

/**
 * Get list of roles that a user can assign
 * @param {string} userRole - Role of the user
 * @returns {string[]} Array of assignable roles
 */
export const getAssignableRoles = (userRole) => {
  const userLevel = ROLE_LEVELS[userRole] || 0;
  
  return Object.entries(ROLE_LEVELS)
    .filter(([role, level]) => level < userLevel)
    .map(([role]) => role)
    .sort((a, b) => ROLE_LEVELS[b] - ROLE_LEVELS[a]); // Sort by level desc
};

/**
 * Check if user has minimum required role
 * @param {string} userRole - User's current role
 * @param {string} requiredRole - Minimum required role
 * @returns {boolean}
 */
export const hasMinimumRole = (userRole, requiredRole) => {
  const userLevel = ROLE_LEVELS[userRole] || 0;
  const requiredLevel = ROLE_LEVELS[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
};

/**
 * Get role display name
 * @param {string} role - Role key
 * @returns {string} Display name
 */
export const getRoleDisplayName = (role) => {
  const displayNames = {
    [ROLES.SUPER_ADMIN]: 'Super Admin',
    [ROLES.SITE_ADMIN]: 'Site Admin',
    [ROLES.SITE_MODERATOR]: 'Site Moderator',
    [ROLES.MEMBER]: 'Member'
  };
  
  return displayNames[role] || role;
};

/**
 * Get role badge color for UI
 * @param {string} role - Role key
 * @returns {string} Color class or hex
 */
export const getRoleBadgeColor = (role) => {
  const colors = {
    [ROLES.SUPER_ADMIN]: '#ff0000', // Red
    [ROLES.SITE_ADMIN]: '#ff8800', // Orange
    [ROLES.SITE_MODERATOR]: '#0088ff', // Blue
    [ROLES.MEMBER]: '#00aa00' // Green
  };
  
  return colors[role] || '#666666';
};
