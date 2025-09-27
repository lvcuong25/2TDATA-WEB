import Database from '../model/Database.js';
import User from '../model/User.js';
import BaseMember from '../model/BaseMember.js';
import BaseRole from '../model/BaseRole.js';
import { isSuperAdmin, hasDatabaseAccess, getUserDatabaseRole, canManageDatabase } from '../utils/permissionUtils.js';

// Create database
export const createDatabase = async (req, res) => {
  try {
    const { name, description } = req.body;
    const currentUserId = req.user._id;
    const siteId = req.siteId; // Get site ID from middleware

    // Find organization where current user is a member
    const Organization = (await import('../model/Organization.js')).default;
    let organization = null;
    let orgId = null;

    // For super admin, allow creating database without organization
    if (isSuperAdmin(req.user)) {
      console.log('🔍 Super admin creating database without organization requirement');
      // Super admin can create database with siteId as orgId
      orgId = siteId;
    } else {
      // Regular users need to be in an organization
      organization = await Organization.findOne({ 
        site_id: siteId,
        'members.user': currentUserId 
      });
      
      if (!organization) {
        return res.status(404).json({ 
          success: false, 
          message: 'Organization not found for this user' 
        });
      }
      orgId = organization._id;
    }

    // Create database with required fields
    const database = new Database({
      name,
      orgId: orgId, // Use organization._id as orgId or siteId for super admin
      ownerId: currentUserId
    });

    await database.save();

    // Create BaseMember entry for the owner
    const baseMember = new BaseMember({
      databaseId: database._id,
      userId: currentUserId,
      role: 'owner'
    });

    await baseMember.save();

    // Create default roles for the database
    const defaultRoles = [
      {
        databaseId: database._id,
        name: 'Manager',
        builtin: true,
        permissions: {
          canManageMembers: true,
          canManageTables: true,
          canManageViews: true,
          canExportData: true,
          canImportData: true
        }
      },
      {
        databaseId: database._id,
        name: 'Member',
        builtin: true,
        permissions: {
          canViewData: true,
          canEditData: true,
          canCreateRecords: true,
          canUpdateRecords: true,
          canDeleteRecords: false
        }
      }
    ];

    await BaseRole.insertMany(defaultRoles);

    res.status(201).json({ success: true, data: database });
  } catch (error) {
    console.error('Error creating database:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get databases
export const getDatabases = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    let databases;
    
    // Super admin có thể xem tất cả database
    if (isSuperAdmin(req.user)) {
      databases = await Database.find({});
    } else {
      // Find all databases where user is a member through BaseMember
      const baseMembers = await BaseMember.find({ userId: currentUserId });
      const databaseIds = baseMembers.map(member => member.databaseId);
      
      // Get the actual databases
      databases = await Database.find({
        _id: { $in: databaseIds }
      });
    }
    
    res.status(200).json({ success: true, data: databases });
  } catch (error) {
    console.error('Error getting databases:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get database by ID
export const getDatabaseById = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const currentUserId = req.user._id;

    const database = await Database.findById(databaseId).populate('ownerId', 'name email');
    
    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }

    // Check if user has access (super admin có quyền truy cập tất cả)
    if (!isSuperAdmin(req.user)) {
      const userMember = await BaseMember.findOne({
        databaseId: databaseId,
        userId: currentUserId
      });

      if (!userMember) {
        return res.status(403).json({ message: 'Access denied to this database' });
      }
    }

    // Get database members
    const members = await BaseMember.find({ databaseId: databaseId })
      .populate('userId', 'name email')
      .lean();

    const databaseWithMembers = {
      ...database.toObject(),
      members: members.map(member => ({
        userId: member.userId,
        role: member.role
      }))
    };

    res.status(200).json({ success: true, data: databaseWithMembers });
  } catch (error) {
    console.error('Error getting database:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Update database
export const updateDatabase = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const { name, description } = req.body;
    const currentUserId = req.user._id;

    const database = await Database.findById(databaseId);
    
    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }

    // Check if user is owner or manager (super admin có quyền update tất cả)
    if (!isSuperAdmin(req.user)) {
      const userMember = await BaseMember.findOne({
        databaseId: databaseId,
        userId: currentUserId
      });

      if (!userMember || !['owner', 'manager'].includes(userMember.role)) {
        return res.status(403).json({ message: 'Only owners and managers can update database' });
      }
    }

    const updatedDatabase = await Database.findByIdAndUpdate(
      databaseId,
      { name },
      { new: true }
    ).populate('ownerId', 'name email');

    res.status(200).json({ success: true, data: updatedDatabase });
  } catch (error) {
    console.error('Error updating database:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete database
export const deleteDatabase = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const currentUserId = req.user._id;

    const database = await Database.findById(databaseId);
    
    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }

    // Check if user is owner (super admin có quyền delete tất cả)
    if (!isSuperAdmin(req.user)) {
      const userMember = await BaseMember.findOne({
        databaseId: databaseId,
        userId: currentUserId
      });

      if (!userMember || userMember.role !== 'owner') {
        return res.status(403).json({ message: 'Only owners can delete database' });
      }
    }

    // Delete all related BaseMember entries
    await BaseMember.deleteMany({ databaseId: databaseId });
    
    // Delete the database
    await Database.findByIdAndDelete(databaseId);
    
    res.status(200).json({ success: true, message: 'Database deleted successfully' });
  } catch (error) {
    console.error('Error deleting database:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get database members
export const getDatabaseMembers = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const currentUserId = req.user._id;

    // console.log(`🔍 getDatabaseMembers called:`, {
    //   databaseId,
    //   currentUserId,
    //   user: req.user
    // });

    if (!databaseId) {
      return res.status(400).json({ message: 'Database ID is required' });
    }

    // Find database
    const database = await Database.findById(databaseId);
    // console.log(`🔍 Database found:`, database);
    
    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }

    // Find base members for this database
    const baseMembers = await BaseMember.find({ databaseId })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 });
    
    // console.log(`🔍 BaseMembers found:`, baseMembers);
    
    // Check if current user has access to this database (super admin có quyền truy cập tất cả)
    console.log(`🔍 User role check:`, {
      userId: currentUserId,
      userRole: req.user.role,
      isSuperAdmin: isSuperAdmin(req.user)
    });
    
    if (!isSuperAdmin(req.user)) {
      console.log(`🔍 Checking access for user:`, {
        currentUserId,
        currentUserIdType: typeof currentUserId,
        baseMembersCount: baseMembers.length,
        baseMembers: baseMembers.map(m => ({
          userId: m.userId?._id,
          userIdType: typeof m.userId?._id,
          role: m.role
        }))
      });

      const userMember = baseMembers.find(member => 
        member.userId._id.toString() === currentUserId.toString()
      );

      console.log(`🔍 User member found:`, userMember);

      // Allow access if user is a member (owner, manager, or member)
      if (!userMember) {
        console.log(`🔍 Access denied - user not found in members`);
        return res.status(403).json({ message: 'Access denied to this database' });
      }
    } else {
      console.log(`🔍 Super admin access granted - bypassing member check`);
    }

    // Return members with populated user data
    let members = baseMembers.map(member => ({
      _id: member._id,
      user: member.userId, // Keep original structure
      role: member.role,
      joinedAt: member.createdAt
    }));

    // If current user is super admin and not in the members list, add them
    if (isSuperAdmin(req.user)) {
      const superAdminInMembers = members.find(member => 
        member.user._id.toString() === currentUserId.toString()
      );
      
      if (!superAdminInMembers) {
        // Add super admin to the members list
        const superAdminUser = await User.findById(currentUserId);
        members.unshift({
          _id: 'super_admin_' + currentUserId,
          user: {
            _id: superAdminUser._id,
            name: superAdminUser.name,
            email: superAdminUser.email
          },
          role: 'owner', // Super admin has owner role
          joinedAt: new Date()
        });
      }
    }

    // console.log(`🔍 Returning members:`, members);

    res.status(200).json({
      success: true,
      data: members
    });

  } catch (error) {
    console.error('Error getting database members:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Update user role in database (for testing purposes)
export const updateUserRole = async (req, res) => {
  try {
    const { databaseId, userId, newRole } = req.body;
    const currentUserId = req.user._id;

    // console.log(`🔍 updateUserRole called:`, {
    //   databaseId,
    //   userId,
    //   newRole,
    //   currentUserId
    // });

    if (!databaseId || !userId || !newRole) {
      return res.status(400).json({ message: 'Database ID, User ID, and new role are required' });
    }

    // Find the member to update
    const baseMember = await BaseMember.findOne({
      databaseId,
      userId
    });

    if (!baseMember) {
      return res.status(404).json({ message: 'User not found in this database' });
    }

    // Update the role
    baseMember.role = newRole;
    await baseMember.save();

    // console.log(`🔍 Updated user role:`, baseMember);

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: baseMember
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};