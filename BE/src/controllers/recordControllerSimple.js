import { Table as PostgresTable, Column as PostgresColumn, Record as PostgresRecord } from '../models/postgres/index.js';
import { Op } from 'sequelize';
import { updateMetabaseTable } from '../utils/metabaseTableCreator.js';
import Table from '../model/Table.js';
import Column from '../model/Column.js';

// Simple Record Controllers that use PostgreSQL
export const createRecordSimple = async (req, res) => {
  try {
    const { tableId, data } = req.body;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';
    const siteId = req.siteId?.toString() || '686d45a89a0a0c37366567c8';

    if (!tableId || !data) {
      return res.status(400).json({ message: 'Table ID and data are required' });
    }

    const table = await PostgresTable.findByPk(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found in PostgreSQL' });
    }

    // Create record in PostgreSQL
    const newRecord = await PostgresRecord.create({
      table_id: tableId,
      user_id: userId,
      site_id: siteId,
      data: data || {}
    });

    console.log(`✅ Record created in PostgreSQL: ${newRecord.id}`);

    // Update Metabase table
    try {
      const metabaseRecord = {
        id: newRecord.id,
        table_id: newRecord.table_id,
        user_id: newRecord.user_id,
        site_id: newRecord.site_id,
        data: newRecord.data,
        created_at: newRecord.created_at,
        updated_at: newRecord.updated_at
      };
      await updateMetabaseTable(tableId, metabaseRecord, 'insert');
      console.log(`✅ Metabase table updated for record: ${newRecord.id}`);
    } catch (metabaseError) {
      console.error('Metabase update failed:', metabaseError);
    }

    res.status(201).json({
      success: true,
      message: 'Record created successfully',
      data: {
        _id: newRecord.id,
        tableId: newRecord.table_id,
        userId: newRecord.user_id,
        siteId: newRecord.site_id,
        data: newRecord.data,
        createdAt: newRecord.created_at,
        updatedAt: newRecord.updated_at
      }
    });

  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getRecordsByTableIdSimple = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { page = 1, limit = 50, sortRules, filterRules } = req.query;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    const table = await PostgresTable.findByPk(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const offset = (page - 1) * limit;

    // Build where clause for filtering
    let whereClause = { table_id: tableId };

    // Parse filter rules if provided
    if (filterRules) {
      try {
        const parsedFilters = JSON.parse(filterRules);
        // Add filter logic here if needed
        console.log('Filter rules:', parsedFilters);
      } catch (error) {
        console.error('Error parsing filter rules:', error);
      }
    }

    // Build order clause for sorting
    let orderClause = [['created_at', 'ASC']];
    if (sortRules) {
      try {
        const parsedSorts = JSON.parse(sortRules);
        if (parsedSorts.length > 0) {
          orderClause = parsedSorts.map(sort => [sort.field, sort.direction.toUpperCase()]);
        }
      } catch (error) {
        console.error('Error parsing sort rules:', error);
      }
    }

    // Get records with pagination
    const { count, rows: records } = await PostgresRecord.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Transform PostgreSQL data to match frontend expected format
    const transformedRecords = records.map(record => ({
      _id: record.id,
      tableId: record.table_id,
      userId: record.user_id,
      siteId: record.site_id,
      data: record.data,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));

    res.status(200).json({
      success: true,
      data: transformedRecords,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getRecordByIdSimple = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    const record = await PostgresRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const table = await PostgresTable.findByPk(record.table_id);
    if (!table) {
      return res.status(404).json({ message: 'Associated table not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: record.id,
        tableId: record.table_id,
        userId: record.user_id,
        siteId: record.site_id,
        data: record.data,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateRecordSimple = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { data } = req.body;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    const record = await PostgresRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const table = await PostgresTable.findByPk(record.table_id);
    if (!table) {
      return res.status(404).json({ message: 'Associated table not found' });
    }

    await record.update({
      data: data !== undefined ? data : record.data
    });

    console.log(`✅ Record updated in PostgreSQL: ${record.id}`);

    // Update Metabase table
    try {
      const metabaseRecord = {
        id: record.id,
        table_id: record.table_id,
        user_id: record.user_id,
        site_id: record.site_id,
        data: record.data,
        created_at: record.created_at,
        updated_at: record.updated_at
      };
      await updateMetabaseTable(record.table_id, metabaseRecord, 'update');
      console.log(`✅ Metabase table updated for record: ${record.id}`);
    } catch (metabaseError) {
      console.error('Metabase update failed:', metabaseError);
    }

    res.status(200).json({
      success: true,
      message: 'Record updated successfully',
      data: {
        _id: record.id,
        tableId: record.table_id,
        userId: record.user_id,
        siteId: record.site_id,
        data: record.data,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }
    });

  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteRecordSimple = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    const record = await PostgresRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const table = await PostgresTable.findByPk(record.table_id);
    if (!table) {
      return res.status(404).json({ message: 'Associated table not found' });
    }

    // Update Metabase table before deleting
    try {
      await updateMetabaseTable(record.table_id, { id: record.id }, 'delete');
      console.log(`✅ Metabase table updated for deleted record: ${record.id}`);
    } catch (metabaseError) {
      console.error('Metabase update failed:', metabaseError);
    }

    await record.destroy();

    console.log(`✅ Record deleted from PostgreSQL: ${record.id}`);

    res.status(200).json({
      success: true,
      message: 'Record deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getTableStructureSimple = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user?._id?.toString() || '68341e4d3f86f9c7ae46e962';

    if (!tableId) {
      return res.status(400).json({ message: "Table ID is required" });
    }

    // Get table from PostgreSQL
    const table = await PostgresTable.findByPk(tableId);
    
    if (!table) {
      // Fallback to MongoDB if not found in PostgreSQL
      const mongoTable = await Table.findOne({ name: 'PostgresX' }).populate('databaseId');
      
      if (!mongoTable) {
        return res.status(404).json({ message: 'Table not found in both PostgreSQL and MongoDB' });
      }
      
      // Get columns from MongoDB
      const columns = await Column.find({ tableId: mongoTable._id }).sort({ order: 1 });
      
      return res.status(200).json({
        success: true,
        data: {
          table: mongoTable,
          columns: columns
        }
      });
    }

    // Get columns from PostgreSQL
    const columns = await PostgresColumn.findAll({
      where: { table_id: tableId },
      order: [['order', 'ASC']]
    });

    // Transform data to match frontend expected format
    const transformedTable = {
      _id: table.id,
      name: table.name,
      description: table.description,
      databaseId: table.database_id,
      userId: table.user_id,
      siteId: table.site_id,
      tableAccessRule: table.table_access_rule,
      columnAccessRules: table.column_access_rules,
      recordAccessRules: table.record_access_rules,
      cellAccessRules: table.cell_access_rules,
      createdAt: table.created_at,
      updatedAt: table.updated_at
    };

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
      data: {
        table: transformedTable,
        columns: transformedColumns
      }
    });

  } catch (error) {
    console.error('Error fetching table structure:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
