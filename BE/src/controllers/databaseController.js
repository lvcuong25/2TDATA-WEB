import Database from "../model/Database.js";
import Table from "../model/Table.js";
import Column from "../model/Column.js";
import Record from "../model/Record.js";
import { toObjectId } from "../utils/helper.js";
import { checkExistIfFail } from "../services/validation.service.js";
import BaseRole from "../model/BaseRole.js";
import Base from "../model/Base.js";

// Database Controllers
export const createDatabase = async (req, res, next) => {
  try {
    const { name, description, baseId } = req.body;
    const userId = req.user._id;
    const siteId = req.siteId;

    checkExistIfFail(Base, { _id: toObjectId(baseId) }, next, "Base not found");

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Database name is required" });
    }

    if (!baseId) {
      return res.status(400).json({ message: "Base is required" });
    }

    const existingDatabase = await Database.findOne({
      name: name.trim(),
      userId,
      siteId,
      baseId: toObjectId(baseId),
    });

    if (existingDatabase) {
      return res
        .status(400)
        .json({ message: "Database with this name already exists" });
    }

    const database = new Database({
      name: name.trim(),
      description: description || "",
      userId,
      siteId,
      baseId: toObjectId(baseId),
    });

    await database.save();

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
    const userId = req.user._id;
    const siteId = req.siteId;
    const baseId = req.query.baseId;

    const databases = await Database.find({ userId, siteId, baseId }).sort({
      createdAt: -1,
    });

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
    const siteId = req.siteId;

    const database = await Database.findOne({
      _id: databaseId,
      userId,
      siteId,
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
    const siteId = req.siteId;

    const database = await Database.findOne({
      _id: databaseId,
      userId,
      siteId,
    });

    if (!database) {
      return res.status(404).json({ message: "Database not found" });
    }

    // Delete all related data (tables, columns, records)
    await Table.deleteMany({ databaseId });
    await Column.deleteMany({ databaseId });
    await Record.deleteMany({ databaseId });
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
