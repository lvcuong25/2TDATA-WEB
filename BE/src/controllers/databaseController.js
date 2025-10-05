import Database from '../model/Database.js';
import User from '../model/User.js';
import BaseMember from '../model/BaseMember.js';
import BaseRole from '../model/BaseRole.js';
import { isSuperAdmin, hasDatabaseAccess, getUserDatabaseRole, canManageDatabase } from '../utils/permissionUtils.js';
import { Table as PostgresTable, Column as PostgresColumn, Record as PostgresRecord } from '../models/postgres/index.js';
import TablePermission from '../model/TablePermission.js';
import ColumnPermission from '../model/ColumnPermission.js';
import RecordPermission from '../model/RecordPermission.js';
import CellPermission from '../model/CellPermission.js';

// Create database
export const createDatabase = async (req, res) => {
  try {
    const { name, description } = req.body;
    const currentUserId = req.user?._id || '68d6b5ad6b97091804aa87c9'; // Default user ID for testing
    const siteId = req.siteId || '68cbdf9729510ea44d90a8e9'; // Default site ID for testing


    // Find organization where current user is a member
    const Organization = (await import('../model/Organization.js')).default;
    let organization = null;
    let orgId = null;

    // For super admin, allow creating database without organization
    if (isSuperAdmin(req.user)) {
      // Super admin can create database with siteId as orgId
      orgId = siteId;
    } else {
      // Regular users must be in an organization to create database
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
    const currentUserId = req.user?._id;
    
    if (!currentUserId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

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

    // Delete all related data in cascade order
    
    // 1. Delete all records first (to avoid foreign key constraints)
    const tables = await PostgresTable.findAll({ where: { database_id: databaseId } });
    for (const table of tables) {
      // Delete all records in this table
      await PostgresRecord.destroy({ where: { table_id: table.id } });
      // Delete all columns in this table
      await PostgresColumn.destroy({ where: { table_id: table.id } });
    }
    
    // 2. Delete all tables
    await PostgresTable.destroy({ where: { database_id: databaseId } });
    
    // 3. Delete all permissions related to this database
    await TablePermission.deleteMany({ 'databaseId._id': databaseId });
    await ColumnPermission.deleteMany({ 'databaseId._id': databaseId });
    await RecordPermission.deleteMany({ 'databaseId._id': databaseId });
    await CellPermission.deleteMany({ 'databaseId._id': databaseId });
    
    // 4. Delete all related BaseMember entries
    await BaseMember.deleteMany({ databaseId: databaseId });
    
    // 5. Finally delete the database
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
    
    if (!isSuperAdmin(req.user)) {

      const userMember = baseMembers.find(member => 
        member.userId._id.toString() === currentUserId.toString()
      );


      // Allow access if user is a member (owner, manager, or member)
      if (!userMember) {
        return res.status(403).json({ message: 'Access denied to this database' });
      }
    } else {
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
// Copy database
export const copyDatabase = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const { name, description } = req.body;
    const currentUserId = req.user?._id;
    const siteId = req.siteId || '68cbdf9729510ea44d90a8e9'; // Default site ID for testing

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Database name is required' });
    }

    // Find the original database
    const originalDatabase = await Database.findById(databaseId);
    if (!originalDatabase) {
      return res.status(404).json({ message: 'Original database not found' });
    }

    // Check if user has permission to copy database
    if (!isSuperAdmin(req.user)) {
      const userMember = await BaseMember.findOne({
        databaseId: databaseId,
        userId: currentUserId
      });

      if (!userMember || !['owner', 'manager'].includes(userMember.role)) {
        return res.status(403).json({ 
          message: 'Only owners and managers can copy database' 
        });
      }
    }

    // Find organization where current user is a member
    const Organization = (await import('../model/Organization.js')).default;
    let organization = null;
    let orgId = null;

    // For super admin, allow creating database without organization
    if (isSuperAdmin(req.user)) {
      // Super admin can create database with siteId as orgId
      orgId = siteId;
    } else {
      // Regular users must be in an organization to create database
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

    // Create new database
    const newDatabase = new Database({
      name: name.trim(),
      description: description || originalDatabase.description,
      orgId: orgId,
      ownerId: currentUserId
    });

    await newDatabase.save();

    // Create BaseMember entry for the owner
    const baseMember = new BaseMember({
      databaseId: newDatabase._id,
      userId: currentUserId,
      role: 'owner'
    });

    await baseMember.save();

    // Create default roles for the new database
    const defaultRoles = [
      {
        databaseId: newDatabase._id,
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
        databaseId: newDatabase._id,
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

    // Copy all tables from original database (both MongoDB and PostgreSQL)
    const Table = (await import('../model/Table.js')).default;
    const Column = (await import('../model/Column.js')).default;
    const Record = (await import('../model/Record.js')).default;
    
    // Get tables from both MongoDB and PostgreSQL
    const [mongoTables, postgresTables] = await Promise.all([
      Table.find({ databaseId: databaseId }),
      PostgresTable.findAll({
        where: { database_id: databaseId }
      })
    ]);
    
    console.log('🔍 MongoDB tables found:', mongoTables.length);
    console.log('🔍 PostgreSQL tables found:', postgresTables.length);
    console.log('🔍 DatabaseId:', databaseId);
    
    const originalTables = mongoTables.length > 0 ? mongoTables : postgresTables;

    for (const originalTable of originalTables) {
      console.log('🔍 Copying table:', originalTable.name);
      
      // Create new table in PostgreSQL (not MongoDB)
      const newTable = await PostgresTable.create({
        name: originalTable.name,
        description: originalTable.description,
        database_id: newDatabase._id.toString(),
        user_id: currentUserId.toString(),
        site_id: originalTable.siteId || originalTable.site_id,
        table_access_rule: originalTable.tableAccessRule || originalTable.table_access_rule,
        column_access_rules: originalTable.columnAccessRules || originalTable.column_access_rules,
        record_access_rules: originalTable.recordAccessRules || originalTable.record_access_rules,
        cell_access_rules: originalTable.cellAccessRules || originalTable.cell_access_rules
      });

      console.log('🔍 Created new table in PostgreSQL:', newTable.id, newTable.name);

      // Copy columns - handle both MongoDB and PostgreSQL sources
      let originalColumns = [];
      
      if (mongoTables.length > 0) {
        // Copy from MongoDB
        originalColumns = await Column.find({ tableId: originalTable._id }).sort({ order: 1 });
      } else {
        // Copy from PostgreSQL
        const postgresColumns = await PostgresColumn.findAll({
          where: { table_id: originalTable.id },
          order: [['order', 'ASC']]
        });
        
        // Transform PostgreSQL columns to MongoDB format
        originalColumns = postgresColumns.map(col => ({
          name: col.name,
          key: col.key,
          type: col.type,
          dataType: col.data_type,
          isRequired: col.is_required,
          isUnique: col.is_unique,
          defaultValue: col.default_value,
          order: col.order,
          siteId: col.site_id
        }));
      }

      for (const originalColumn of originalColumns) {
        // Create new column in PostgreSQL
        await PostgresColumn.create({
          name: originalColumn.name,
          key: originalColumn.key,
          type: originalColumn.type,
          data_type: originalColumn.dataType,
          is_required: originalColumn.isRequired,
          is_unique: originalColumn.isUnique,
          default_value: originalColumn.defaultValue,
          order: originalColumn.order,
          table_id: newTable.id,
          user_id: currentUserId.toString(),
          site_id: originalColumn.siteId
        });
      }

      // Copy records - handle both MongoDB and PostgreSQL sources
      let originalRecords = [];
      
      if (mongoTables.length > 0) {
        // Copy from MongoDB
        originalRecords = await Record.find({ tableId: originalTable._id });
      } else {
        // Copy from PostgreSQL
        const postgresRecords = await PostgresRecord.findAll({
          where: { table_id: originalTable.id }
        });
        
        // Transform PostgreSQL records to MongoDB format
        originalRecords = postgresRecords.map(rec => ({
          data: rec.data,
          siteId: rec.site_id
        }));
      }

      for (const originalRecord of originalRecords) {
        // Create new record in PostgreSQL
        await PostgresRecord.create({
          data: originalRecord.data,
          table_id: newTable.id,
          user_id: currentUserId.toString(),
          site_id: originalRecord.siteId
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Database copied successfully',
      data: {
        database: {
          _id: newDatabase._id,
          name: newDatabase.name,
          description: newDatabase.description,
          orgId: newDatabase.orgId,
          ownerId: newDatabase.ownerId,
          createdAt: newDatabase.createdAt,
          updatedAt: newDatabase.updatedAt
        },
        tablesCount: originalTables.length
      }
    });

  } catch (error) {
    console.error('Error copying database:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Remove member from database
export const removeDatabaseMember = async (req, res) => {
  try {
    const { databaseId, memberId } = req.params;
    const currentUserId = req.user._id;
    
    // DEBUG: Log user info
    console.log('🔍 DEBUG removeDatabaseMember:');
    console.log('  - Current user ID:', currentUserId);
    console.log('  - Current user email:', req.user.email);
    console.log('  - Current user role:', req.user.role);
    console.log('  - isSuperAdmin result:', isSuperAdmin(req.user));
    
    // Check if current user has permission to remove members
    if (!isSuperAdmin(req.user)) {
      console.log('  ❌ Not super admin, checking database role...');
      
      // Check if user is database owner or has admin role
      const database = await Database.findById(databaseId);
      if (!database) {
        return res.status(404).json({ 
          success: false, 
          message: 'Database not found' 
        });
      }
      
      const currentUserRole = await getUserDatabaseRole(currentUserId, databaseId);
      console.log('  - User database role:', currentUserRole?.name || 'none');
      
      if (!currentUserRole || (currentUserRole.name !== 'owner' && currentUserRole.name !== 'admin')) {
        return res.status(403).json({ 
          success: false, 
          message: 'Permission denied. Only owner, admin or super admin can remove members' 
        });
      }
    } else {
      console.log('  ✅ User is super admin, permission granted');
    }
    
    // Remove member from BaseMember collection
    const result = await BaseMember.findOneAndDelete({
      databaseId: databaseId,
      userId: memberId
    });
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Member not found in this database' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Member removed successfully',
      data: result 
    });
    
  } catch (error) {
    console.error('Error removing database member:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error', 
      error: error.message 
    });
  }
};