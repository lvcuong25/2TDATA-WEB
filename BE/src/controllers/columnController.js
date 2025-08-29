import Column from '../model/Column.js';
import Table from '../model/Table.js';
import Database from '../model/Database.js';

// Column Controllers
export const createColumn = async (req, res) => {
  try {
    const { tableId, name, dataType, isRequired, isUnique, defaultValue, checkboxConfig } = req.body;
    const userId = req.user._id;
    const siteId = req.siteId;

    console.log('Creating column with data:', {
      tableId,
      name,
      dataType,
      isRequired,
      isUnique,
      defaultValue,
      checkboxConfig
    });

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Column name is required' });
    }

    if (!dataType) {
      return res.status(400).json({ message: 'Data type is required' });
    }

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    // Verify table exists and belongs to user
    const table = await Table.findOne({
      _id: tableId,
      userId,
      siteId
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const existingColumn = await Column.findOne({
      name: name.trim(),
      tableId
    });

    if (existingColumn) {
      return res.status(400).json({ message: 'Column with this name already exists in this table' });
    }

    // Get the next order number
    const lastColumn = await Column.findOne({ tableId }).sort({ order: -1 });
    const nextOrder = lastColumn ? lastColumn.order + 1 : 0;

    // Prepare column data
    const columnData = {
      name: name.trim(),
      dataType,
      isRequired: isRequired || false,
      isUnique: isUnique || false,
      defaultValue,
      order: nextOrder,
      tableId,
      databaseId: table.databaseId,
      userId,
      siteId
    };

    // Only add checkboxConfig if dataType is checkbox and checkboxConfig is provided
    if (dataType === 'checkbox' && checkboxConfig) {
      // Ensure checkboxConfig has all required fields with defaults
      columnData.checkboxConfig = {
        icon: checkboxConfig.icon || 'check-circle',
        color: checkboxConfig.color || '#52c41a',
        defaultValue: checkboxConfig.defaultValue !== undefined ? checkboxConfig.defaultValue : false
      };
    }

    console.log('Column data to save:', columnData);

    const column = new Column(columnData);

    console.log('About to save column...');
    await column.save();
    console.log('Column saved successfully:', column);

    res.status(201).json({
      success: true,
      message: 'Column created successfully',
      data: column
    });
  } catch (error) {
    console.error('Error creating column:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const getColumns = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user._id;
    const siteId = req.siteId;

    // Verify table exists and belongs to user
    const table = await Table.findOne({
      _id: tableId,
      userId,
      siteId
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const columns = await Column.find({ tableId })
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      data: columns
    });
  } catch (error) {
    console.error('Error fetching columns:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getColumnById = async (req, res) => {
  try {
    const { columnId } = req.params;
    const userId = req.user._id;
    const siteId = req.siteId;

    const column = await Column.findOne({
      _id: columnId,
      userId,
      siteId
    });

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    res.status(200).json({
      success: true,
      data: column
    });
  } catch (error) {
    console.error('Error fetching column:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { name, dataType, isRequired, isUnique, defaultValue, order, checkboxConfig } = req.body;
    const userId = req.user._id;
    const siteId = req.siteId;

    const column = await Column.findOne({
      _id: columnId,
      userId,
      siteId
    });

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    if (name && name.trim() !== '') {
      const existingColumn = await Column.findOne({
        name: name.trim(),
        tableId: column.tableId,
        _id: { $ne: columnId }
      });

      if (existingColumn) {
        return res.status(400).json({ message: 'Column with this name already exists in this table' });
      }

      column.name = name.trim();
    }

    if (dataType) {
      column.dataType = dataType;
    }

    if (isRequired !== undefined) {
      column.isRequired = isRequired;
    }

    if (isUnique !== undefined) {
      column.isUnique = isUnique;
    }

    if (defaultValue !== undefined) {
      column.defaultValue = defaultValue;
    }

    if (order !== undefined) {
      column.order = order;
    }

    // Only update checkboxConfig if dataType is checkbox and checkboxConfig is provided
    if (dataType === 'checkbox' && checkboxConfig !== undefined) {
      column.checkboxConfig = checkboxConfig;
    } else if (dataType !== 'checkbox') {
      // Remove checkboxConfig if dataType is not checkbox
      column.checkboxConfig = undefined;
    }

    await column.save();

    res.status(200).json({
      success: true,
      message: 'Column updated successfully',
      data: column
    });
  } catch (error) {
    console.error('Error updating column:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    const userId = req.user._id;
    const siteId = req.siteId;

    const column = await Column.findOne({
      _id: columnId,
      userId,
      siteId
    });

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Warning: This will delete all data in this column
    // In a real application, you might want to add a confirmation step
    await Column.deleteOne({ _id: columnId });

    res.status(200).json({
      success: true,
      message: 'Column deleted successfully. All data in this column has been lost.'
    });
  } catch (error) {
    console.error('Error deleting column:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
