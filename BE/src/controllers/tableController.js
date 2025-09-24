import Table from '../model/Table.js';
import Column from '../model/Column.js';
import Record from '../model/Record.js';
import Database from '../model/Database.js';

// Table Controllers
export const createTable = async (req, res) => {
  try {
    const { databaseId, name, description } = req.body;
    const userId = req.user._id;
    const siteId = req.siteId;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Table name is required' });
    }

    if (!databaseId) {
      return res.status(400).json({ message: 'Database ID is required' });
    }

    // Verify database exists and belongs to user
    const database = await Database.findOne({
      _id: databaseId,
      userId,
      siteId
    });

    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }

    const existingTable = await Table.findOne({
      name: name.trim(),
      databaseId
    });

    if (existingTable) {
      return res.status(400).json({ message: 'Table with this name already exists in this database' });
    }

    const table = new Table({
      name: name.trim(),
      description: description || '',
      databaseId,
      userId,
      siteId,
      baseId: database.baseId
    });

    await table.save();

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
    const siteId = req.siteId;

    // Verify database exists and belongs to user
    const database = await Database.findOne({
      _id: databaseId,
      userId,
      siteId
    });

    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }

    const tables = await Table.find({ databaseId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tables
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
    const siteId = req.siteId;

    const table = await Table.findOne({
      _id: tableId,
      userId,
      siteId
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (name && name.trim() !== '') {
      const existingTable = await Table.findOne({
        name: name.trim(),
        databaseId: table.databaseId,
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
    const siteId = req.siteId;

    const table = await Table.findOne({
      _id: tableId,
      userId,
      siteId
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
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
    const siteId = req.siteId;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Table name is required' });
    }

    if (!targetDatabaseId) {
      return res.status(400).json({ message: 'Target database ID is required' });
    }

    // Find the original table
    const originalTable = await Table.findOne({
      _id: tableId,
      userId,
      siteId
    });

    if (!originalTable) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Verify target database exists and belongs to user
    const targetDatabase = await Database.findOne({
      _id: targetDatabaseId,
      userId,
      siteId
    });

    if (!targetDatabase) {
      return res.status(404).json({ message: 'Target database not found' });
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
      userId,
      siteId
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
        dataType: originalColumn.dataType,
        isRequired: originalColumn.isRequired,
        defaultValue: originalColumn.defaultValue,
        description: originalColumn.description || '',
        tableId: newTable._id,
        databaseId: targetDatabaseId,
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
        databaseId: targetDatabaseId,
        userId,
        siteId
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

