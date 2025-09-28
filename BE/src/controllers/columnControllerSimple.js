import { Table as PostgresTable, Column as PostgresColumn } from '../models/postgres/index.js';
import { createMetabaseTable } from '../utils/metabaseTableCreator.js';

// Simple Column Controllers that use PostgreSQL
export const createColumnSimple = async (req, res) => {
  try {
    const {
      tableId, name, dataType, isRequired, isUnique, defaultValue,
      checkboxConfig, singleSelectConfig, multiSelectConfig, formulaConfig,
      dateConfig, currencyConfig, percentConfig, urlConfig, phoneConfig,
      timeConfig, ratingConfig, linkedTableConfig, lookupConfig
    } = req.body;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';
    const siteId = req.siteId?.toString() || '686d45a89a0a0c37366567c8';

    if (!tableId || !name || name.trim() === '' || !dataType) {
      return res.status(400).json({ message: 'Table ID, name, and dataType are required' });
    }

    const table = await PostgresTable.findByPk(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found in PostgreSQL' });
    }

    // Generate a unique key for the column
    let key = name.trim().toLowerCase().replace(/\s+/g, '_');
    let keyExists = await PostgresColumn.findOne({ where: { table_id: tableId, key } });
    let counter = 1;
    while (keyExists) {
      key = `${name.trim().toLowerCase().replace(/\s+/g, '_')}_${counter}`;
      keyExists = await PostgresColumn.findOne({ where: { table_id: tableId, key } });
      counter++;
    }

    // Check if column name already exists for this table_id
    const existingColumn = await PostgresColumn.findOne({
      where: {
        name: name.trim(),
        table_id: tableId
      }
    });

    if (existingColumn) {
      return res.status(400).json({
        message: 'Column name already exists in this table'
      });
    }

    // Determine the 'order' for the new column
    const lastColumn = await PostgresColumn.findOne({
      where: { table_id: tableId },
      order: [['order', 'DESC']]
    });
    const order = lastColumn ? lastColumn.order + 1 : 0;

    // Map frontend dataType to backend type
    const mapDataTypeToColumnType = (dataType) => {
      switch (dataType) {
        case 'number':
        case 'year':
        case 'currency':
        case 'percent':
        case 'rating':
          return 'number';
        case 'date':
        case 'datetime':
        case 'time':
          return 'date';
        case 'checkbox':
          return 'boolean';
        case 'multi_select':
        case 'json':
        case 'linked_table':
        case 'lookup':
          return 'json';
        default:
          return 'string';
      }
    };

    // Create column in PostgreSQL
    const newColumn = await PostgresColumn.create({
      name: name.trim(),
      key: key,
      type: mapDataTypeToColumnType(dataType),
      data_type: dataType,
      table_id: tableId,
      user_id: userId,
      site_id: siteId,
      is_required: isRequired || false,
      is_unique: isUnique || false,
      default_value: defaultValue,
      checkbox_config: checkboxConfig,
      single_select_config: singleSelectConfig,
      multi_select_config: multiSelectConfig,
      formula_config: formulaConfig,
      date_config: dateConfig,
      currency_config: currencyConfig,
      percent_config: percentConfig,
      url_config: urlConfig,
      phone_config: phoneConfig,
      time_config: timeConfig,
      rating_config: ratingConfig,
      linked_table_config: linkedTableConfig,
      lookup_config: lookupConfig,
      order: order
    });

    console.log(`✅ Column created in PostgreSQL: ${newColumn.name} (${newColumn.data_type})`);

    // Recreate Metabase table with new column
    try {
      const metabaseResult = await createMetabaseTable(tableId, table.name, 'column-added');
      if (metabaseResult.success) {
        console.log(`✅ Metabase table recreated with new column: ${newColumn.name}`);
      } else {
        console.error('Metabase table recreation failed:', metabaseResult.error);
      }
    } catch (metabaseError) {
      console.error('Metabase update failed:', metabaseError);
    }

    res.status(201).json({
      success: true,
      message: 'Column created successfully',
      data: {
        _id: newColumn.id,
        name: newColumn.name,
        key: newColumn.key,
        type: newColumn.type,
        dataType: newColumn.data_type,
        tableId: newColumn.table_id,
        userId: newColumn.user_id,
        siteId: newColumn.site_id,
        isRequired: newColumn.is_required,
        isUnique: newColumn.is_unique,
        defaultValue: newColumn.default_value,
        checkboxConfig: newColumn.checkbox_config,
        singleSelectConfig: newColumn.single_select_config,
        multiSelectConfig: newColumn.multi_select_config,
        formulaConfig: newColumn.formula_config,
        dateConfig: newColumn.date_config,
        currencyConfig: newColumn.currency_config,
        percentConfig: newColumn.percent_config,
        urlConfig: newColumn.url_config,
        phoneConfig: newColumn.phone_config,
        timeConfig: newColumn.time_config,
        ratingConfig: newColumn.rating_config,
        linkedTableConfig: newColumn.linked_table_config,
        lookupConfig: newColumn.lookup_config,
        order: newColumn.order,
        createdAt: newColumn.created_at,
        updatedAt: newColumn.updated_at
      }
    });

  } catch (error) {
    console.error('Error creating column:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getColumnsByTableIdSimple = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    const table = await PostgresTable.findByPk(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const columns = await PostgresColumn.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });

    // Transform PostgreSQL data to match frontend expected format
    const transformedColumns = columns.map(column => ({
      _id: column.id,
      name: column.name,
      key: column.key,
      type: column.type,
      dataType: column.data_type,
      tableId: column.table_id,
      userId: column.user_id,
      siteId: column.site_id,
      isRequired: column.is_required,
      isUnique: column.is_unique,
      defaultValue: column.default_value,
      checkboxConfig: column.checkbox_config,
      singleSelectConfig: column.single_select_config,
      multiSelectConfig: column.multi_select_config,
      formulaConfig: column.formula_config,
      dateConfig: column.date_config,
      currencyConfig: column.currency_config,
      percentConfig: column.percent_config,
      urlConfig: column.url_config,
      phoneConfig: column.phone_config,
      timeConfig: column.time_config,
      ratingConfig: column.rating_config,
      linkedTableConfig: column.linked_table_config,
      lookupConfig: column.lookup_config,
      order: column.order,
      createdAt: column.created_at,
      updatedAt: column.updated_at
    }));

    res.status(200).json({
      success: true,
      data: transformedColumns
    });

  } catch (error) {
    console.error('Error fetching columns:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateColumnSimple = async (req, res) => {
  try {
    const { columnId } = req.params;
    const {
      name, dataType, isRequired, isUnique, defaultValue, order,
      checkboxConfig, singleSelectConfig, multiSelectConfig, formulaConfig,
      dateConfig, currencyConfig, percentConfig, urlConfig, phoneConfig,
      timeConfig, ratingConfig, linkedTableConfig, lookupConfig
    } = req.body;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    const column = await PostgresColumn.findByPk(columnId);
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    const table = await PostgresTable.findByPk(column.table_id);
    if (!table) {
      return res.status(404).json({ message: 'Associated table not found' });
    }

    // Check for duplicate name if name is being updated
    if (name && name.trim() !== column.name) {
      const existingColumn = await PostgresColumn.findOne({
        where: {
          name: name.trim(),
          table_id: column.table_id,
          id: { [Op.ne]: columnId }
        }
      });

      if (existingColumn) {
        return res.status(400).json({ message: 'Column name already exists in this table' });
      }
    }

    // Map frontend dataType to backend type
    const mapDataTypeToColumnType = (dataType) => {
      switch (dataType) {
        case 'number':
        case 'year':
        case 'currency':
        case 'percent':
        case 'rating':
          return 'number';
        case 'date':
        case 'datetime':
        case 'time':
          return 'date';
        case 'checkbox':
          return 'boolean';
        case 'multi_select':
        case 'json':
        case 'linked_table':
        case 'lookup':
          return 'json';
        default:
          return 'string';
      }
    };

    const updateData = {
      name: name ? name.trim() : column.name,
      data_type: dataType || column.data_type,
      is_required: isRequired !== undefined ? isRequired : column.is_required,
      is_unique: isUnique !== undefined ? isUnique : column.is_unique,
      default_value: defaultValue !== undefined ? defaultValue : column.default_value,
      order: order !== undefined ? order : column.order,
      checkbox_config: checkboxConfig !== undefined ? checkboxConfig : column.checkbox_config,
      single_select_config: singleSelectConfig !== undefined ? singleSelectConfig : column.single_select_config,
      multi_select_config: multiSelectConfig !== undefined ? multiSelectConfig : column.multi_select_config,
      formula_config: formulaConfig !== undefined ? formulaConfig : column.formula_config,
      date_config: dateConfig !== undefined ? dateConfig : column.date_config,
      currency_config: currencyConfig !== undefined ? currencyConfig : column.currency_config,
      percent_config: percentConfig !== undefined ? percentConfig : column.percent_config,
      url_config: urlConfig !== undefined ? urlConfig : column.url_config,
      phone_config: phoneConfig !== undefined ? phoneConfig : column.phone_config,
      time_config: timeConfig !== undefined ? timeConfig : column.time_config,
      rating_config: ratingConfig !== undefined ? ratingConfig : column.rating_config,
      linked_table_config: linkedTableConfig !== undefined ? linkedTableConfig : column.linked_table_config,
      lookup_config: lookupConfig !== undefined ? lookupConfig : column.lookup_config,
    };

    // Update the 'type' based on the new 'data_type' if it changed
    if (dataType && dataType !== column.data_type) {
      updateData.type = mapDataTypeToColumnType(dataType);
    }

    await column.update(updateData);

    console.log(`✅ Column updated in PostgreSQL: ${column.name} (${column.id})`);

    res.status(200).json({
      success: true,
      message: 'Column updated successfully',
      data: {
        _id: column.id,
        name: column.name,
        key: column.key,
        type: column.type,
        dataType: column.data_type,
        tableId: column.table_id,
        userId: column.user_id,
        siteId: column.site_id,
        isRequired: column.is_required,
        isUnique: column.is_unique,
        defaultValue: column.default_value,
        checkboxConfig: column.checkbox_config,
        singleSelectConfig: column.single_select_config,
        multiSelectConfig: column.multi_select_config,
        formulaConfig: column.formula_config,
        dateConfig: column.date_config,
        currencyConfig: column.currency_config,
        percentConfig: column.percent_config,
        urlConfig: column.url_config,
        phoneConfig: column.phone_config,
        timeConfig: column.time_config,
        ratingConfig: column.rating_config,
        linkedTableConfig: column.linked_table_config,
        lookupConfig: column.lookup_config,
        order: column.order,
        createdAt: column.created_at,
        updatedAt: column.updated_at
      }
    });

  } catch (error) {
    console.error('Error updating column:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteColumnSimple = async (req, res) => {
  try {
    const { columnId } = req.params;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    const column = await PostgresColumn.findByPk(columnId);
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    const table = await PostgresTable.findByPk(column.table_id);
    if (!table) {
      return res.status(404).json({ message: 'Associated table not found' });
    }

    await column.destroy();

    console.log(`✅ Column deleted from PostgreSQL: ${column.name} (${column.id})`);

    res.status(200).json({
      success: true,
      message: 'Column deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting column:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
