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
      siteId
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

