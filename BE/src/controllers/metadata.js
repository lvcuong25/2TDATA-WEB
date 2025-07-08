import { getAssignableRoles, getRoleDisplayName, getRoleBadgeColor } from '../utils/roleHierarchy.js';
import Site from '../model/Site.js';

/**
 * Get metadata for user creation form
 * Returns assignable roles and available sites based on user's permissions
 */
export const getUserFormMetadata = async (req, res, next) => {
    try {
        const userRole = req.user?.role || 'member';
        
        // Get assignable roles with display info
        const assignableRoles = getAssignableRoles(userRole).map(role => ({
            value: role,
            label: getRoleDisplayName(role),
            color: getRoleBadgeColor(role)
        }));
        
        // Get available sites based on user role
        let availableSites = [];
        
        if (userRole === 'super_admin') {
            // Super admin can see all sites
            const sites = await Site.find({ status: 'active' })
                .select('_id name domains')
                .sort({ name: 1 });
                
            availableSites = sites.map(site => ({
                value: site._id,
                label: site.name,
                domains: site.domains
            }));
        } else if (userRole === 'site_admin' && req.user.site_id) {
            // Site admin can only see their own site
            const site = await Site.findById(req.user.site_id)
                .select('_id name domains');
                
            if (site) {
                availableSites = [{
                    value: site._id,
                    label: site.name,
                    domains: site.domains
                }];
            }
        }
        
        return res.status(200).json({
            assignableRoles,
            availableSites,
            currentUserRole: {
                value: userRole,
                label: getRoleDisplayName(userRole),
                color: getRoleBadgeColor(userRole)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all role information for display
 */
export const getAllRoles = async (req, res, next) => {
    try {
        const roles = ['super_admin', 'site_admin', 'site_moderator', 'member'];
        
        const roleInfo = roles.map(role => ({
            value: role,
            label: getRoleDisplayName(role),
            color: getRoleBadgeColor(role)
        }));
        
        return res.status(200).json({
            roles: roleInfo
        });
    } catch (error) {
        next(error);
    }
};
