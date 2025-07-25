import Permission from '../model/Permission.js';
import RolePermission from '../model/RolePermission.js';

/**
 * Default permissions for the system
 */
const DEFAULT_PERMISSIONS = [
  // Site management
  { name: 'site.create', description: 'Create new sites', category: 'site', is_system: true },
  { name: 'site.read', description: 'View sites', category: 'site', is_system: true },
  { name: 'site.update', description: 'Update sites', category: 'site', is_system: true },
  { name: 'site.delete', description: 'Delete sites', category: 'site', is_system: true },
  { name: 'site.manage_admins', description: 'Manage site administrators', category: 'site', is_system: true },
  
  // User management
  { name: 'user.create', description: 'Create users', category: 'user', is_system: true },
  { name: 'user.read', description: 'View users', category: 'user', is_system: true },
  { name: 'user.update', description: 'Update users', category: 'user', is_system: true },
  { name: 'user.delete', description: 'Delete users', category: 'user', is_system: true },
  { name: 'user.manage_roles', description: 'Manage user roles', category: 'user', is_system: true },
  
  // Content management
  { name: 'content.create', description: 'Create content', category: 'content', is_system: true },
  { name: 'content.read', description: 'View content', category: 'content', is_system: true },
  { name: 'content.update', description: 'Update content', category: 'content', is_system: true },
  { name: 'content.delete', description: 'Delete content', category: 'content', is_system: true },
  { name: 'content.publish', description: 'Publish content', category: 'content', is_system: true },
  
  // Analytics
  { name: 'analytics.read', description: 'View analytics', category: 'analytics', is_system: true },
  { name: 'analytics.export', description: 'Export analytics data', category: 'analytics', is_system: true },
  
  // System
  { name: 'system.settings', description: 'Manage system settings', category: 'system', is_system: true },
  { name: 'system.logs', description: 'View system logs', category: 'system', is_system: true },
  { name: 'system.backup', description: 'Manage system backups', category: 'system', is_system: true }
];

/**
 * Default role permissions mapping
 */
const DEFAULT_ROLE_PERMISSIONS = {
  'super_admin': [
    // Super admin has all permissions
    '*'
  ],
  'site_admin': [
    'site.read',
    'site.update',
    'site.manage_admins',
    'user.create',
    'user.read',
    'user.update',
    'user.delete',
    'content.create',
    'content.read',
    'content.update',
    'content.delete',
    'content.publish',
    'analytics.read',
    'analytics.export'
  ],
  'admin': [
    'user.read',
    'user.update',
    'content.create',
    'content.read',
    'content.update',
    'content.delete',
    'analytics.read'
  ],
  'member': [
    'content.read',
    'user.read' // Can only read their own profile
  ]
};

/**
 * Setup default permissions in database
 */
export async function setupDefaultPermissions() {
  try {
    // Create permissions
    for (const permData of DEFAULT_PERMISSIONS) {
      const existing = await Permission.findOne({ name: permData.name });
      if (!existing) {
        await Permission.create(permData);
        }
    }
    
    } catch (error) {
    console.error('❌ Error setting up permissions:', error);
    throw error;
  }
}

/**
 * Setup default role permissions
 */
export async function setupDefaultRolePermissions() {
  try {
    // Get all permissions
    const permissions = await Permission.find({});
    const permissionMap = {};
    permissions.forEach(p => {
      permissionMap[p.name] = p._id;
    });
    
    // Setup role permissions
    for (const [role, permissionNames] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      // Clear existing role permissions
      await RolePermission.deleteMany({ role, site_id: null });
      
      // Add new permissions
      for (const permName of permissionNames) {
        if (permName === '*') {
          // Super admin wildcard - add all permissions
          for (const perm of permissions) {
            await RolePermission.create({
              role,
              permission_id: perm._id,
              site_id: null // Global permission
            });
          }
        } else if (permissionMap[permName]) {
          await RolePermission.create({
            role,
            permission_id: permissionMap[permName],
            site_id: null // Global permission
          });
        }
      }
      
      }
    
    } catch (error) {
    console.error('❌ Error setting up role permissions:', error);
    throw error;
  }
}

/**
 * Grant specific permissions to a role for a site
 */
export async function grantSitePermissions(role, siteId, permissionNames) {
  try {
    const permissions = await Permission.find({ 
      name: { $in: permissionNames } 
    });
    
    for (const permission of permissions) {
      const existing = await RolePermission.findOne({
        role,
        permission_id: permission._id,
        site_id: siteId
      });
      
      if (!existing) {
        await RolePermission.create({
          role,
          permission_id: permission._id,
          site_id: siteId
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error granting site permissions:', error);
    throw error;
  }
}

/**
 * Revoke permissions from a role for a site
 */
export async function revokeSitePermissions(role, siteId, permissionNames) {
  try {
    const permissions = await Permission.find({ 
      name: { $in: permissionNames } 
    });
    
    const permissionIds = permissions.map(p => p._id);
    
    await RolePermission.deleteMany({
      role,
      permission_id: { $in: permissionIds },
      site_id: siteId
    });
    
    return true;
  } catch (error) {
    console.error('Error revoking site permissions:', error);
    throw error;
  }
}

export default {
  setupDefaultPermissions,
  setupDefaultRolePermissions,
  grantSitePermissions,
  revokeSitePermissions
};
