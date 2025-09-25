import Database from "../model/Database.js";
import Table from "../model/Table.js";
import Column from "../model/Column.js";
import Record from "../model/Record.js";
import { toObjectId } from "../utils/helper.js";
import { checkExistIfFail } from "../services/validation.service.js";
import BaseRole from "../model/BaseRole.js";
import Base from "../model/Base.js";
import BaseMember from "../model/BaseMember.js";
import Organization from "../model/Organization.js";

// Database Controllers - Now working with Base directly
export const createDatabase = async (req, res, next) => {
  try {
    console.log("createDatabase - req.user:", req.user);
    console.log("createDatabase - req.body:", req.body);
    
    const { name, description } = req.body;
    const userId = req.user._id;
    const siteId = req.user.site_id;

    console.log("createDatabase - userId:", userId);
    console.log("createDatabase - siteId:", siteId);

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Database name is required" });
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find organization where user is a member and check role
    const organization = await Organization.findOne({ 
      'members.user': userId 
    });
    
    if (!organization) {
      return res.status(404).json({ message: "Organization not found or user is not a member" });
    }

    // Check if user is owner or manager (only they can create databases)
    const userMember = organization.members.find(member => 
      member.user.toString() === userId.toString()
    );
    
    if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'manager')) {
      return res.status(403).json({ 
        message: "Access denied - only organization owners and managers can create databases" 
      });
    }

    // Check if database with this name already exists for this organization
    const existingDatabase = await Database.findOne({
      name: name.trim(),
      orgId: organization._id,
    });

    if (existingDatabase) {
      return res
        .status(400)
        .json({ message: "Database with this name already exists" });
    }

    // Create new database (which is actually a Base)
    const database = new Database({
      name: name.trim(),
      description: description || "",
      ownerId: userId,
      orgId: organization._id,
    });

    console.log("createDatabase - saving database:", database);
    await database.save();
    console.log("createDatabase - database saved successfully");

    // Automatically add the creator as owner of the database
    try {
      // Check if there's already an owner for this database
      const existingOwner = await BaseMember.findOne({
        baseId: database._id,
        role: 'owner'
      });

      if (existingOwner) {
        console.log("createDatabase - owner already exists, demoting to manager");
        // If there's already an owner, demote them to manager
        await BaseMember.findOneAndUpdate(
          { baseId: database._id, role: 'owner' },
          { role: 'manager' }
        );
      }

      const baseMember = new BaseMember({
        baseId: database._id,
        userId: userId,
        role: 'owner'
      });

      console.log("createDatabase - creating base member:", baseMember);
      await baseMember.save();
      console.log("createDatabase - base member created successfully");
    } catch (baseMemberError) {
      console.error("Error creating base member:", baseMemberError);
      // If base member creation fails, delete the database to maintain consistency
      await Database.deleteOne({ _id: database._id });
      return res.status(500).json({ 
        message: "Database created but failed to add user as owner. Database has been deleted." 
      });
    }

    res.status(201).json({
      success: true,
      message: "Database created successfully",
      data: database,
    });
  } catch (error) {
    console.error("Error creating database:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getDatabases = async (req, res) => {
  try {
    console.log("getDatabases - req.user:", req.user);
    console.log("getDatabases - req.user._id:", req.user?._id);
    console.log("getDatabases - req.user.site_id:", req.user?.site_id);
    
    const userId = req.user._id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find organization where user is a member
    const organization = await Organization.findOne({ 
      'members.user': userId 
    });
    
    if (!organization) {
      return res.status(404).json({ message: "Organization not found or user is not a member" });
    }

    console.log("getDatabases - found organization:", organization.name, organization._id);

    // Check user role in organization
    const userMember = organization.members.find(member => 
      member.user.toString() === userId.toString()
    );
    
    let databases;
    
    if (userMember && (userMember.role === 'owner' || userMember.role === 'manager')) {
      // Owner/Manager: can see all databases in the organization
      databases = await Database.find({ 
        orgId: organization._id
      }).sort({
        createdAt: -1,
      });
      console.log("getDatabases - owner/manager found databases:", databases.length);
    } else {
      // Member: can only see databases they are added to
      const baseMembers = await BaseMember.find({ userId }).select('databaseId');
      const baseIds = baseMembers.map(bm => bm.databaseId);
      console.log("getDatabases - member baseIds:", baseIds);
      
      databases = await Database.find({ 
        _id: { $in: baseIds }
      }).sort({
        createdAt: -1,
      });
      console.log("getDatabases - member found databases:", databases.length);
    }

    console.log("getDatabases - found databases:", databases.length);

    res.status(200).json({
      success: true,
      data: databases,
    });
  } catch (error) {
    console.error("Error fetching databases:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getDatabaseById = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user._id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find organization where user is a member
    const organization = await Organization.findOne({ 
      'members.user': userId 
    });
    
    if (!organization) {
      return res.status(404).json({ message: "Organization not found or user is not a member" });
    }

    // Find database by ID and organization
    const database = await Database.findOne({
      _id: databaseId,
      orgId: organization._id,
    });

    if (!database) {
      return res.status(404).json({ message: "Database not found" });
    }

    res.status(200).json({
      success: true,
      data: database,
    });
  } catch (error) {
    console.error("Error fetching database:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateDatabase = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const { name, description } = req.body;
    const userId = req.user._id;
    const siteId = req.siteId;

    const database = await Database.findOne({
      _id: databaseId,
      userId,
      siteId,
    });

    if (!database) {
      return res.status(404).json({ message: "Database not found" });
    }

    if (name && name.trim() !== "") {
      const existingDatabase = await Database.findOne({
        name: name.trim(),
        userId,
        siteId,
        _id: { $ne: databaseId },
      });

      if (existingDatabase) {
        return res
          .status(400)
          .json({ message: "Database with this name already exists" });
      }

      database.name = name.trim();
    }

    if (description !== undefined) {
      database.description = description;
    }

    await database.save();

    res.status(200).json({
      success: true,
      message: "Database updated successfully",
      data: database,
    });
  } catch (error) {
    console.error("Error updating database:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteDatabase = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user._id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find organization where user is a member
    const organization = await Organization.findOne({ 
      'members.user': userId 
    });
    
    if (!organization) {
      return res.status(404).json({ message: "Organization not found or user is not a member" });
    }

    const database = await Database.findOne({
      _id: databaseId,
      orgId: organization._id,
    });

    if (!database) {
      return res.status(404).json({ message: "Database not found" });
    }

    // Check if user has permission to delete this database (must be owner or manager)
    const baseMember = await BaseMember.findOne({ 
      baseId: databaseId, 
      userId 
    });

    if (!baseMember) {
      return res.status(403).json({ message: "Access denied - you are not a member of this database" });
    }

    // Only owner can delete database
    if (baseMember.role !== 'owner') {
      return res.status(403).json({ message: "Access denied - only database owners can delete databases" });
    }

    // Delete all related data (tables, columns, records, base members)
    await Table.deleteMany({ baseId: databaseId });
    await Column.deleteMany({ tableId: { $in: await Table.find({ baseId: databaseId }).distinct('_id') } });
    await Record.deleteMany({ tableId: { $in: await Table.find({ baseId: databaseId }).distinct('_id') } });
    await BaseMember.deleteMany({ baseId: databaseId });
    await Database.deleteOne({ _id: databaseId });

    res.status(200).json({
      success: true,
      message: "Database and all its data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting database:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const copyDatabase = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const { name, description } = req.body;
    const userId = req.user._id;
    const siteId = req.siteId;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Database name is required" });
    }

    // Find the original database
    const originalDatabase = await Database.findOne({
      _id: databaseId,
      userId,
      siteId,
    });

    if (!originalDatabase) {
      return res.status(404).json({ message: "Database not found" });
    }

    // Check if database with new name already exists
    const existingDatabase = await Database.findOne({
      name: name.trim(),
      userId,
      siteId,
    });

    if (existingDatabase) {
      return res
        .status(400)
        .json({ message: "Database with this name already exists" });
    }

    // Create new database
    const newDatabase = new Database({
      name: name.trim(),
      description: description || originalDatabase.description || "",
      userId,
      siteId,
    });

    await newDatabase.save();

    // Get all tables from original database
    const originalTables = await Table.find({ databaseId });

    // Copy all tables and their related data
    for (const originalTable of originalTables) {
      // Create new table
      const newTable = new Table({
        name: originalTable.name,
        description: originalTable.description || "",
        databaseId: newDatabase._id,
        userId,
        siteId,
      });

      await newTable.save();

      // Get all columns from original table
      const originalColumns = await Column.find({ tableId: originalTable._id });

      // Copy all columns
      for (const originalColumn of originalColumns) {
        const newColumn = new Column({
          name: originalColumn.name,
          dataType: originalColumn.dataType,
          isRequired: originalColumn.isRequired,
          defaultValue: originalColumn.defaultValue,
          description: originalColumn.description || "",
          tableId: newTable._id,
          databaseId: newDatabase._id,
          userId,
          siteId,
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
          order: originalColumn.order,
        });

        await newColumn.save();
      }

      // Get all records from original table (MOVED OUTSIDE COLUMN LOOP)
      const originalRecords = await Record.find({ tableId: originalTable._id });

      // Copy all records
      for (const originalRecord of originalRecords) {
        const newRecord = new Record({
          data: originalRecord.data,
          tableId: newTable._id,
          databaseId: newDatabase._id,
          userId,
          siteId,
        });

        await newRecord.save();
      }
    }

    res.status(201).json({
      success: true,
      message:
        "Database copied successfully with all tables, columns and formulas",
      data: newDatabase,
    });
  } catch (error) {
    console.error("Error copying database:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
