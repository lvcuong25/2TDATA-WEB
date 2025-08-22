import Database from '../model/Database.js';
import Table from '../model/Table.js';
import Column from '../model/Column.js';
import Record from '../model/Record.js';

// Database Controllers
export const createDatabase = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user._id;
    const siteId = req.siteId;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Database name is required' });
    }

    const existingDatabase = await Database.findOne({
      name: name.trim(),
      userId,
      siteId
    });

    if (existingDatabase) {
      return res.status(400).json({ message: 'Database with this name already exists' });
    }

    const database = new Database({
      name: name.trim(),
      description: description || '',
      userId,
      siteId
    });

    await database.save();

    res.status(201).json({
      success: true,
      message: 'Database created successfully',
      data: database
    });
  } catch (error) {
    console.error('Error creating database:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDatabases = async (req, res) => {
  try {
    const userId = req.user._id;
    const siteId = req.siteId;

    const databases = await Database.find({ userId, siteId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: databases
    });
  } catch (error) {
    console.error('Error fetching databases:', error);
    res.status(500).json({ message: 'Internal server error' });
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
      siteId
    });

    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }

    res.status(200).json({
      success: true,
      data: database
    });
  } catch (error) {
    console.error('Error fetching database:', error);
    res.status(500).json({ message: 'Internal server error' });
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
      siteId
    });

    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }

    if (name && name.trim() !== '') {
      const existingDatabase = await Database.findOne({
        name: name.trim(),
        userId,
        siteId,
        _id: { $ne: databaseId }
      });

      if (existingDatabase) {
        return res.status(400).json({ message: 'Database with this name already exists' });
      }

      database.name = name.trim();
    }

    if (description !== undefined) {
      database.description = description;
    }

    await database.save();

    res.status(200).json({
      success: true,
      message: 'Database updated successfully',
      data: database
    });
  } catch (error) {
    console.error('Error updating database:', error);
    res.status(500).json({ message: 'Internal server error' });
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
      siteId
    });

    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }

    // Delete all related data (tables, columns, records)
    await Table.deleteMany({ databaseId });
    await Column.deleteMany({ databaseId });
    await Record.deleteMany({ databaseId });
    await Database.deleteOne({ _id: databaseId });

    res.status(200).json({
      success: true,
      message: 'Database and all its data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting database:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
