import Column from '../model/Column.js';
import Table from '../model/Table.js';
import Database from '../model/Database.js';
import Record from '../model/Record.js';

// Column Controllers
export const createColumn = async (req, res) => {
  try {
    const { tableId, name, dataType, isRequired, isUnique, defaultValue, checkboxConfig, singleSelectConfig, multiSelectConfig, dateConfig, formulaConfig, currencyConfig, percentConfig, urlConfig, phoneConfig, timeConfig, ratingConfig, linkedTableConfig } = req.body;
    const userId = req.user._id;
    const siteId = req.siteId;

    console.log('Creating column with data:', {
      tableId,
      name,
      dataType,
      isRequired,
      isUnique,
      defaultValue,
      checkboxConfig,
      singleSelectConfig,
      multiSelectConfig,
      dateConfig,
      currencyConfig,
      percentConfig,
      urlConfig,
      phoneConfig,
      timeConfig,
      ratingConfig,
      linkedTableConfig
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

    // Only add singleSelectConfig if dataType is single_select and singleSelectConfig is provided
    if (dataType === 'single_select' && singleSelectConfig) {
      // Ensure singleSelectConfig has all required fields with defaults
      columnData.singleSelectConfig = {
        options: singleSelectConfig.options || [],
        defaultValue: singleSelectConfig.defaultValue || ''
      };
    }

    // Only add multiSelectConfig if dataType is multi_select and multiSelectConfig is provided
    if (dataType === 'multi_select' && multiSelectConfig) {
      // Ensure multiSelectConfig has all required fields with defaults
      columnData.multiSelectConfig = {
        options: multiSelectConfig.options || [],
        defaultValue: multiSelectConfig.defaultValue || []
      };
    }

    // Only add dateConfig if dataType is date and dateConfig is provided
    if (dataType === 'date' && dateConfig) {
      // Ensure dateConfig has all required fields with defaults
      columnData.dateConfig = {
        format: dateConfig.format || 'YYYY-MM-DD'
      };
    }

    // Only add formulaConfig if dataType is formula and formulaConfig is provided
    if (dataType === 'formula' && formulaConfig) {
      // Ensure formulaConfig has all required fields with defaults
      columnData.formulaConfig = {
        formula: formulaConfig.formula || '',
        resultType: formulaConfig.resultType || 'number',
        dependencies: formulaConfig.dependencies || [],
        description: formulaConfig.description || ''
      };
    }

    // Only add currencyConfig if dataType is currency and currencyConfig is provided
    if (dataType === 'currency' && currencyConfig) {
      // Ensure currencyConfig has all required fields with defaults
      columnData.currencyConfig = {
        currency: currencyConfig.currency || 'USD',
        symbol: currencyConfig.symbol || '$',
        position: currencyConfig.position || 'before',
        decimalPlaces: currencyConfig.decimalPlaces !== undefined ? currencyConfig.decimalPlaces : 2,
        thousandsSeparator: currencyConfig.thousandsSeparator || ',',
        decimalSeparator: currencyConfig.decimalSeparator || '.'
      };
    }

    // Only add percentConfig if dataType is percent and percentConfig is provided
    if (dataType === 'percent' && percentConfig) {
      // Ensure percentConfig has all required fields with defaults
      columnData.percentConfig = {
        displayFormat: percentConfig.displayFormat || 'percentage',
        displayAsProgress: percentConfig.displayAsProgress || false,
        defaultValue: percentConfig.defaultValue !== undefined ? percentConfig.defaultValue : 0
      };
    }

    // Always add urlConfig for url dataType
    if (dataType === 'url') {
      // Ensure urlConfig has all required fields with defaults
      columnData.urlConfig = {
        protocol: (urlConfig && urlConfig.protocol) || 'https'
      };
      console.log('Backend: Adding URL config:', {
        dataType,
        urlConfig,
        columnData: columnData.urlConfig
      });
    } else {
      console.log('Backend: URL dataType but no urlConfig:', {
        dataType,
        urlConfig,
        hasUrlConfig: !!urlConfig
      });
    }

    // Phone data type doesn't need special config, just basic validation
    if (dataType === 'phone') {
      // Add phoneConfig if provided (even if empty)
      if (phoneConfig !== undefined) {
        columnData.phoneConfig = phoneConfig;
      }
      console.log('Backend: Creating phone column:', {
        dataType,
        name,
        hasPhoneConfig: !!phoneConfig,
        phoneConfig
      });
    }

    // Time data type doesn't need special config, just basic validation
    if (dataType === 'time') {
      // Add timeConfig if provided (even if empty)
      if (timeConfig !== undefined) {
        columnData.timeConfig = timeConfig;
      }
      console.log('Backend: Creating time column:', {
        dataType,
        name,
        hasTimeConfig: !!timeConfig,
        timeConfig
      });
    }

    // Rating data type doesn't need special config, just basic validation
    if (dataType === 'rating') {
      // Add ratingConfig if provided (even if empty)
      if (ratingConfig !== undefined) {
        columnData.ratingConfig = ratingConfig;
      }
      console.log('Backend: Creating rating column:', {
        dataType,
        name,
        hasRatingConfig: !!ratingConfig,
        ratingConfig
      });
    }

    // Only add linkedTableConfig if dataType is linked_table and linkedTableConfig is provided
    if (dataType === 'linked_table' && linkedTableConfig) {
      // Ensure linkedTableConfig has all required fields with defaults
      columnData.linkedTableConfig = {
        linkedTableId: linkedTableConfig.linkedTableId,
        allowMultiple: linkedTableConfig.allowMultiple || false,
        defaultValue: linkedTableConfig.defaultValue || null,
        filterRules: linkedTableConfig.filterRules || []
      };
      console.log('Backend: Creating linked_table column:', {
        dataType,
        name,
        hasLinkedTableConfig: !!linkedTableConfig,
        linkedTableConfig: columnData.linkedTableConfig
      });
    }

    // Set default value for currency column if not provided
    if (dataType === 'currency' && (columnData.defaultValue === undefined || columnData.defaultValue === null)) {
      columnData.defaultValue = 0;
    }

    // Set default value for percent column if not provided
    if (dataType === 'percent' && (columnData.defaultValue === undefined || columnData.defaultValue === null)) {
      columnData.defaultValue = 0;
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
    const { name, dataType, isRequired, isUnique, defaultValue, order, checkboxConfig, singleSelectConfig, multiSelectConfig, dateConfig, formulaConfig, currencyConfig, percentConfig, urlConfig, phoneConfig, timeConfig, ratingConfig, linkedTableConfig } = req.body;
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

    const oldColumnName = column.name;
    let shouldUpdateRecordData = false;

    // Check if name is being changed
    if (name && name.trim() !== '' && name.trim() !== oldColumnName) {
      const existingColumn = await Column.findOne({
        name: name.trim(),
        tableId: column.tableId,
        _id: { $ne: columnId }
      });

      if (existingColumn) {
        return res.status(400).json({ message: 'Column with this name already exists in this table' });
      }

      shouldUpdateRecordData = true;
    }

    // If column name was changed, update all records FIRST before changing column metadata
    if (shouldUpdateRecordData && name.trim() !== oldColumnName) {
      console.log(`Updating records: renaming column key from "${oldColumnName}" to "${name.trim()}"`);
      
      // Find all records that have data for the old column name
      const records = await Record.find({ 
        tableId: column.tableId,
        [`data.${oldColumnName}`]: { $exists: true }
      });
      
      let updatedCount = 0;
      for (const record of records) {
        if (record.data && record.data[oldColumnName] !== undefined) {
          const oldValue = record.data[oldColumnName];
          
          // Create new data object
          const newData = { ...record.data };
          delete newData[oldColumnName];
          newData[name.trim()] = oldValue;
          
          record.data = newData;
          record.markModified('data');
          await record.save();
          updatedCount++;
        }
      }
      
      console.log(`Successfully renamed column key in ${updatedCount} records from "${oldColumnName}" to "${name.trim()}"`);
    }

    // Now update column metadata
    if (name && name.trim() !== '') {
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

    // Handle config objects based on dataType
    if (dataType === 'checkbox' && checkboxConfig !== undefined) {
      column.checkboxConfig = checkboxConfig;
    } else if (dataType !== 'checkbox') {
      column.checkboxConfig = undefined;
    }

    if (dataType === 'single_select' && singleSelectConfig !== undefined) {
      column.singleSelectConfig = singleSelectConfig;
    } else if (dataType !== 'single_select') {
      column.singleSelectConfig = undefined;
    }

    if (dataType === 'multi_select' && multiSelectConfig !== undefined) {
      column.multiSelectConfig = multiSelectConfig;
    } else if (dataType !== 'multi_select') {
      column.multiSelectConfig = undefined;
    }

    if (dataType === 'date' && dateConfig !== undefined) {
      column.dateConfig = dateConfig;
    } else if (dataType !== 'date') {
      column.dateConfig = undefined;
    }

    if (dataType === 'formula' && formulaConfig !== undefined) {
      column.formulaConfig = formulaConfig;
    } else if (dataType !== 'formula') {
      column.formulaConfig = undefined;
    }

    if (dataType === 'currency' && currencyConfig !== undefined) {
      column.currencyConfig = currencyConfig;
    } else if (dataType !== 'currency') {
      column.currencyConfig = undefined;
    }

    if (dataType === 'percent' && percentConfig !== undefined) {
      column.percentConfig = percentConfig;
    } else if (dataType !== 'percent') {
      column.percentConfig = undefined;
    }

    if (dataType === 'url') {
      column.urlConfig = {
        protocol: (urlConfig && urlConfig.protocol) || 'https'
      };
      console.log('Backend: Updating URL config:', {
        dataType,
        urlConfig,
        columnUrlConfig: column.urlConfig
      });
    } else if (dataType !== 'url') {
      column.urlConfig = undefined;
    }

    // Phone data type doesn't need special config
    if (dataType === 'phone') {
      // Add phoneConfig if provided (even if empty)
      if (phoneConfig !== undefined) {
        column.phoneConfig = phoneConfig;
      }
      console.log('Backend: Updating phone column:', {
        dataType,
        name,
        hasPhoneConfig: !!phoneConfig,
        phoneConfig
      });
    }

    // Time data type doesn't need special config
    if (dataType === 'time') {
      // Add timeConfig if provided (even if empty)
      if (timeConfig !== undefined) {
        column.timeConfig = timeConfig;
      }
      console.log('Backend: Updating time column:', {
        dataType,
        name,
        hasTimeConfig: !!timeConfig,
        timeConfig
      });
    }

    // Rating data type doesn't need special config
    if (dataType === 'rating') {
      // Add ratingConfig if provided (even if empty)
      if (ratingConfig !== undefined) {
        column.ratingConfig = ratingConfig;
      }
      console.log('Backend: Updating rating column:', {
        dataType,
        name,
        hasRatingConfig: !!ratingConfig,
        ratingConfig
      });
    }

    // Linked table data type configuration
    if (dataType === 'linked_table' && linkedTableConfig !== undefined) {
      column.linkedTableConfig = linkedTableConfig;
      console.log('Backend: Updating linked_table column:', {
        dataType,
        name,
        hasLinkedTableConfig: !!linkedTableConfig,
        linkedTableConfig
      });
    } else if (dataType !== 'linked_table') {
      column.linkedTableConfig = undefined;
    }

    // Set default value for currency column if not provided
    if (dataType === 'currency' && defaultValue === undefined && column.defaultValue === undefined) {
      column.defaultValue = 0;
    }

    // Save the column
    await column.save();

    res.status(200).json({
      success: true,
      message: 'Column updated successfully',
      data: column
    });
  } catch (error) {
    console.error('Error updating column:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getLinkedTableData = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { search, limit = 50, page = 1 } = req.query;
    const userId = req.user._id;
    const siteId = req.siteId;

    // Find the column
    const column = await Column.findOne({
      _id: columnId,
      userId,
      siteId
    });

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    if (column.dataType !== 'linked_table') {
      return res.status(400).json({ message: 'Column is not a linked table type' });
    }

    if (!column.linkedTableConfig || !column.linkedTableConfig.linkedTableId) {
      return res.status(400).json({ message: 'Linked table configuration not found' });
    }

    const linkedTableId = column.linkedTableConfig.linkedTableId;

    // Build query for records
    let query = { tableId: linkedTableId };
    
    // Add search functionality if search term provided
    if (search && search.trim()) {
      query.$or = [
        { 'data.name': { $regex: search.trim(), $options: 'i' } },
        { 'data.title': { $regex: search.trim(), $options: 'i' } },
        { 'data.email': { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get records from linked table
    const records = await Record.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const totalCount = await Record.countDocuments(query);

    console.log('🔍 Backend: Query and Records:', {
      query: query,
      recordsCount: records.length,
      totalCount: totalCount,
      firstRecord: records[0] ? {
        _id: records[0]._id,
        tableId: records[0].tableId,
        data: records[0].data,
        dataKeys: Object.keys(records[0].data || {})
      } : null
    });

    // Get linked table info
    const linkedTable = await Table.findOne({ _id: linkedTableId });

    // Get columns of the linked table
    const linkedTableColumns = await Column.find({
      tableId: linkedTableId,
      userId,
      siteId
    }).sort({ order: 1 });

    console.log('🔍 getLinkedTableData Debug:', {
      columnId,
      linkedTableId,
      query,
      recordsCount: records.length,
      totalCount,
      linkedTable: linkedTable ? { _id: linkedTable._id, name: linkedTable.name } : null,
      linkedTableColumns: linkedTableColumns.map(col => ({ _id: col._id, name: col.name })),
      firstRecord: records[0] ? { _id: records[0]._id, data: records[0].data } : null,
      allRecordsData: records.map(r => ({ _id: r._id, dataKeys: Object.keys(r.data || {}) }))
    });

    // Transform records to options format
    const options = records.map((record, index) => {
      // Try to get the first column with data as label
      let label = `Record ${index + 1}`;
      if (record.data && Object.keys(record.data).length > 0) {
        // Get the first column that has data
        const firstColumn = linkedTableColumns[0];
        if (firstColumn && record.data[firstColumn.name]) {
          label = String(record.data[firstColumn.name]);
        } else {
          // Fallback to any available data
          const dataKeys = Object.keys(record.data);
          const firstDataKey = dataKeys.find(key => record.data[key] && String(record.data[key]).trim());
          if (firstDataKey) {
            label = String(record.data[firstDataKey]);
          }
        }
      }
      
      return {
        value: record._id,
        label: label,
        recordId: record._id,
        data: record.data
      };
    });

    console.log('🔍 Backend: All records data:', records.map(record => ({
      _id: record._id,
      tableId: record.tableId,
      data: record.data,
      dataKeys: Object.keys(record.data || {}),
      dataEntries: Object.entries(record.data || {}).map(([key, val]) => ({ key, value: val }))
    })));

    console.log('🔍 Backend: Transformed options:', options.map(option => ({
      value: option.value,
      label: option.label,
      data: option.data,
      dataKeys: Object.keys(option.data || {})
    })));

    res.status(200).json({
      success: true,
      data: {
        options,
        totalCount,
        linkedTable: linkedTable ? {
          _id: linkedTable._id,
          name: linkedTable.name
        } : null,
        linkedTableColumns: linkedTableColumns.map(col => ({
          _id: col._id,
          name: col.name,
          dataType: col.dataType,
          order: col.order
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching linked table data:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
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

    const columnName = column.name;
    const tableId = column.tableId;

    console.log(`Deleting column "${columnName}" and cleaning up data in all records`);

    // Remove the column data from all records in this table first
    await Record.updateMany(
      { tableId: tableId },
      {
        $unset: { [`data.${columnName}`]: "" }
      }
    );

    // Then delete column metadata
    await Column.deleteOne({ _id: columnId });

    console.log(`Successfully deleted column "${columnName}" and removed data from all records`);

    res.status(200).json({
      success: true,
      message: `Column "${columnName}" deleted successfully. All data in this column has been removed.`
    });
  } catch (error) {
    console.error('Error deleting column:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
