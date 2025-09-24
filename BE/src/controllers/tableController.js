import Table from '../model/Table.js';
import Column from '../model/Column.js';
import Record from '../model/Record.js';
import Database from '../model/Database.js';
import Base from '../model/Base.js';
import BaseMember from '../model/BaseMember.js';
import Organization from '../model/Organization.js';

// Table Controllers
export const createTable = async (req, res) => {
  try {
    const { baseId, databaseId, name, description } = req.body;
    const userId = req.user._id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Table name is required' });
    }

    // Accept both baseId and databaseId (they are the same thing)
    const actualBaseId = baseId || databaseId;
    
    if (!actualBaseId) {
      return res.status(400).json({ message: 'Base ID is required' });
    }

    // Verify base exists (Database is alias of Base)
    const base = await Base.findById(actualBaseId);

    if (!base) {
      return res.status(404).json({ message: 'Base not found' });
    }

    // Check if user is a member of this database and has permission to create tables
    const baseMember = await BaseMember.findOne({ 
      databaseId: actualBaseId, 
      userId 
    });

    if (!baseMember) {
      return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
    }

    // Only owner and manager can create tables
    if (baseMember.role !== 'owner' && baseMember.role !== 'manager') {
      return res.status(403).json({ 
        message: 'Access denied - only database owners and managers can create tables' 
      });
    }

    const existingTable = await Table.findOne({
      name: name.trim(),
      databaseId: actualBaseId
    });

    if (existingTable) {
      return res.status(400).json({ message: 'Table with this name already exists in this base' });
    }

    const table = new Table({
      name: name.trim(),
      description: description || '',
      databaseId: actualBaseId,
      userId
    });

    await table.save();

    // Tạo default permissions cho tất cả members
    const TablePermission = (await import('../model/TablePermission.js')).default;
    const defaultPermission = new TablePermission({
      tableId: table._id,
      databaseId: actualBaseId,
      targetType: 'all_members',
      permissions: {
        canView: true,
        canEditStructure: true,
        canEditData: true,
        canAddData: true
      },
      viewPermissions: {
        canView: true,
        canAddView: true,
        canEditView: true
      },
      createdBy: userId,
      isDefault: true // Đánh dấu là permission mặc định
    });

    await defaultPermission.save();

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: table
    });
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTables = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user._id;

    if (!databaseId) {
      return res.status(400).json({ message: "Database ID is required" });
    }

    // Get database to find orgId directly
    const database = await Database.findById(databaseId);
    
    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }

    // Check if user is a member of this database (either through organization or direct database membership)
    const baseMember = await BaseMember.findOne({ 
      databaseId: databaseId, 
      userId 
    });

    if (!baseMember) {
      // If not a direct database member, check if user is organization member
      const organization = await Organization.findOne({ 
        _id: database.orgId,
        'members.user': userId 
      });
      
      if (!organization) {
        return res.status(403).json({ message: "Access denied - user is not a member of this database" });
      }
    }

    const tables = await Table.find({ databaseId: databaseId })
      .sort({ createdAt: -1 });

    // Filter tables based on user permissions
    let visibleTables = tables;
    
    if (baseMember && baseMember.role === 'member') {
      // For members, check table permissions
      const TablePermission = (await import('../model/TablePermission.js')).default;
      
      const tablePermissions = await TablePermission.find({
        tableId: { $in: tables.map(t => t._id) },
        $or: [
          { targetType: 'all_members' },
          { targetType: 'specific_user', userId: userId },
          { targetType: 'specific_role', role: baseMember.role }
        ]
      });

      // Create a map of table permissions
      const tablePermissionMap = {};
      tablePermissions.forEach(perm => {
        if (!tablePermissionMap[perm.tableId]) {
          tablePermissionMap[perm.tableId] = {
            canView: false,
            isHidden: true
          };
        }
        
        // Apply permissions based on priority: specific_user > specific_role > all_members
        if (perm.permissions) {
          tablePermissionMap[perm.tableId].canView = tablePermissionMap[perm.tableId].canView || perm.permissions.canView;
          if (perm.permissions.isHidden === false) {
            tablePermissionMap[perm.tableId].isHidden = false;
          }
        }
      });

      // Filter tables - only show tables that user can view and are not hidden
      visibleTables = tables.filter(table => {
        const permissions = tablePermissionMap[table._id];
        if (!permissions) {
          // No permissions set, hide by default for members
          return false;
        }
        return permissions.canView && !permissions.isHidden;
      });
    }
    // For owners and managers, show all tables

    res.status(200).json({
      success: true,
      data: visibleTables
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTableById = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user._id;
    const siteId = req.siteId;

    const table = await Table.findOne({
      _id: tableId,
      userId,
      siteId
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.status(200).json({
      success: true,
      data: table
    });
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { name, description } = req.body;
    const userId = req.user._id;

    const table = await Table.findOne({
      _id: tableId
    }).populate('databaseId');

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user is a member of this database and has permission to update tables
    const baseMember = await BaseMember.findOne({ 
      databaseId: table.databaseId._id, 
      userId 
    });

    if (!baseMember) {
      return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
    }

    // Only owner and manager can update tables
    if (baseMember.role !== 'owner' && baseMember.role !== 'manager') {
      return res.status(403).json({ 
        message: 'Access denied - only database owners and managers can update tables' 
      });
    }

    if (name && name.trim() !== '') {
      const existingTable = await Table.findOne({
        name: name.trim(),
        databaseId: table.databaseId._id,
        _id: { $ne: tableId }
      });

      if (existingTable) {
        return res.status(400).json({ message: 'Table with this name already exists in this database' });
      }

      table.name = name.trim();
    }

    if (description !== undefined) {
      table.description = description;
    }

    await table.save();

    res.status(200).json({
      success: true,
      message: 'Table updated successfully',
      data: table
    });
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user._id;

    const table = await Table.findOne({
      _id: tableId
    }).populate('databaseId');

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user is a member of this database and has permission to delete tables
    const baseMember = await BaseMember.findOne({ 
      databaseId: table.databaseId._id, 
      userId 
    });

    if (!baseMember) {
      return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
    }

    // Only owner and manager can delete tables
    if (baseMember.role !== 'owner' && baseMember.role !== 'manager') {
      return res.status(403).json({ 
        message: 'Access denied - only database owners and managers can delete tables' 
      });
    }

    // Delete all related data (columns, records)
    await Column.deleteMany({ tableId });
    await Record.deleteMany({ tableId });
    await Table.deleteOne({ _id: tableId });

    res.status(200).json({
      success: true,
      message: 'Table and all its data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const copyTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { name, description, targetDatabaseId } = req.body;
    const userId = req.user._id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Table name is required' });
    }

    if (!targetDatabaseId) {
      return res.status(400).json({ message: 'Target database ID is required' });
    }

    // Find the original table
    const originalTable = await Table.findOne({
      _id: tableId
    }).populate('databaseId');

    if (!originalTable) {
      return res.status(404).json({ message: 'Original table not found' });
    }

    // Check if user is a member of the original database and has permission to copy tables
    const baseMember = await BaseMember.findOne({ 
      databaseId: originalTable.databaseId._id, 
      userId 
    });

    if (!baseMember) {
      return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
    }

    // Only owner and manager can copy tables
    if (baseMember.role !== 'owner' && baseMember.role !== 'manager') {
      return res.status(403).json({ 
        message: 'Access denied - only database owners and managers can copy tables' 
      });
    }

    // Verify target database exists and user has access to it
    const targetDatabase = await Database.findById(targetDatabaseId);
    
    if (!targetDatabase) {
      return res.status(404).json({ message: 'Target database not found' });
    }

    // Check if user is a member of the target database
    const targetBaseMember = await BaseMember.findOne({ 
      databaseId: targetDatabaseId, 
      userId 
    });

    if (!targetBaseMember) {
      return res.status(403).json({ message: 'Access denied - you are not a member of the target database' });
    }

    // Check if table with new name already exists in target database
    const existingTable = await Table.findOne({
      name: name.trim(),
      databaseId: targetDatabaseId
    });

    if (existingTable) {
      return res.status(400).json({ message: 'Table with this name already exists in the target database' });
    }

    // Create new table
    const newTable = new Table({
      name: name.trim(),
      description: description || originalTable.description || '',
      databaseId: targetDatabaseId,
      userId
    });

    await newTable.save();

    // Get all columns from original table
    const originalColumns = await Column.find({ tableId: originalTable._id });

    // Create mapping for old to new column IDs (for formula references)
    const columnIdMapping = {};

    // Copy all columns FIRST
    for (const originalColumn of originalColumns) {
      const newColumn = new Column({
        name: originalColumn.name,
        key: originalColumn.key || `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dataType: originalColumn.dataType,
        isRequired: originalColumn.isRequired,
        defaultValue: originalColumn.defaultValue,
        description: originalColumn.description || '',
        tableId: newTable._id,
        databaseId: targetDatabaseId,
        userId,
        // Copy lookup and linked table configurations
        lookupTableId: originalColumn.lookupTableId,
        lookupColumnId: originalColumn.lookupColumnId,
        linkedTableId: originalColumn.linkedTableId,
        linkedColumnId: originalColumn.linkedColumnId,
        displayColumnId: originalColumn.displayColumnId,
        // Copy other column properties
        isUnique: originalColumn.isUnique,
        isIndexed: originalColumn.isIndexed,
        validationRules: originalColumn.validationRules,
        options: originalColumn.options,
        // IMPORTANT: Copy formula configuration
        formulaConfig: originalColumn.formulaConfig,
        // Copy additional properties that might exist
        format: originalColumn.format,
        precision: originalColumn.precision,
        min: originalColumn.min,
        max: originalColumn.max,
        step: originalColumn.step,
        width: originalColumn.width,
        order: originalColumn.order
      });

      await newColumn.save();
      
      // Store mapping for formula references
      columnIdMapping[originalColumn._id.toString()] = newColumn._id.toString();
    }

    // Now copy all records ONCE (outside the column loop)
    const originalRecords = await Record.find({ tableId: originalTable._id });

    for (const originalRecord of originalRecords) {
      const newRecord = new Record({
        data: originalRecord.data,
        tableId: newTable._id,
        userId,
        siteId: req.user.site_id
      });

      await newRecord.save();
    }

    res.status(201).json({
      success: true,
      message: 'Table copied successfully with all columns and formulas',
      data: newTable
    });
  } catch (error) {
    console.error('Error copying table:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

