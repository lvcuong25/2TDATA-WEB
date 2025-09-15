// Fixed copyTable function - chỉ hiển thị phần cần sửa
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

    // Create mapping for old to new column IDs
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
        // Copy other possible fields
        format: originalColumn.format,
        precision: originalColumn.precision,
        min: originalColumn.min,
        max: originalColumn.max,
        step: originalColumn.step
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
      message: 'Table copied successfully',
      data: newTable
    });
  } catch (error) {
    console.error('Error copying table:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
