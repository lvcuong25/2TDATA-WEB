import Column from '../model/Column.js';
import Table from '../model/Table.js';
import Database from '../model/Database.js';
import Record from '../model/Record.js';
import Organization from '../model/Organization.js';
import BaseMember from '../model/BaseMember.js';
import { isSuperAdmin } from '../utils/permissionUtils.js';
// PostgreSQL imports
import { Column as PostgresColumn, Table as PostgresTable, Record as PostgresRecord } from '../models/postgres/index.js';

// Column Controllers
export const createColumn = async (req, res) => {
  try {
    const { tableId, name, dataType, isRequired, isUnique, defaultValue, checkboxConfig, singleSelectConfig, multiSelectConfig, dateConfig, formulaConfig, currencyConfig, percentConfig, urlConfig, phoneConfig, timeConfig, ratingConfig, linkedTableConfig, lookupConfig } = req.body;
    const userId = req.user._id;

    // console.log('Creating column with data:', {
    //   tableId,
    //   name,
    //   dataType,
    //   isRequired,
    //   isUnique,
    //   defaultValue,
    //   checkboxConfig,
    //   singleSelectConfig,
    //   multiSelectConfig,
    //   dateConfig,
    //   currencyConfig,
    //   percentConfig,
    //   urlConfig,
    //   phoneConfig,
    //   timeConfig,
    //   ratingConfig,
    //   linkedTableConfig,
    //   lookupConfig
    // });

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Column name is required' });
    }

    if (!dataType) {
      return res.status(400).json({ message: 'Data type is required' });
    }

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    // Verify table exists and belongs to user (check both MongoDB and PostgreSQL)
    const [mongoTable, postgresTable] = await Promise.all([
      Table.findOne({ _id: tableId }).populate('databaseId'),
      PostgresTable.findByPk(tableId)
    ]);

    const table = mongoTable || postgresTable;
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Get database ID from either source
    const databaseId = mongoTable ? mongoTable.databaseId._id : postgresTable.database_id;

    // Check if user is a member of the database
    // Super admin có quyền tạo column trong mọi database
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({
        databaseId: databaseId,
        userId
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }

      // Check if user has permission to edit table structure
      if (baseMember.role === 'member') {
      // For members, check table permissions
      const TablePermission = (await import('../model/TablePermission.js')).default;
      
      const tablePermissions = await TablePermission.find({
        tableId: tableId,
        $or: [
          { targetType: 'all_members' },
          { targetType: 'specific_user', userId: userId },
          { targetType: 'specific_role', role: baseMember.role }
        ]
      });

      let canEditStructure = false;
      
      // Sort permissions by priority: specific_user > specific_role > all_members
      const sortedPermissions = tablePermissions.sort((a, b) => {
        const priority = { 'specific_user': 3, 'specific_role': 2, 'all_members': 1 };
        return (priority[b.targetType] || 0) - (priority[a.targetType] || 0);
      });
      
      // Check permissions in priority order
      for (const perm of sortedPermissions) {
        if (perm.permissions && perm.permissions.canEditStructure !== undefined) {
          canEditStructure = perm.permissions.canEditStructure;
          // Stop at first permission found (highest priority)
          break;
        }
      }

      if (!canEditStructure) {
        return res.status(403).json({ message: 'Access denied - you do not have permission to edit table structure' });
      }
    }
    }
    // Owners and managers can always edit table structure

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
      key: name.trim().toLowerCase().replace(/\s+/g, '_'),
      dataType,
      isRequired: isRequired || false,
      isUnique: isUnique || false,
      defaultValue,
      order: nextOrder,
      tableId,
      userId,
      siteId: req.user?.site_id
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
      // console.log('Backend: Adding URL config:', {
      //   dataType,
      //   urlConfig,
      //   columnData: columnData.urlConfig
      // });
    } else {
      // console.log('Backend: URL dataType but no urlConfig:', {
      //   dataType,
      //   urlConfig,
      //   hasUrlConfig: !!urlConfig
      // });
    }

    // Phone data type doesn't need special config, just basic validation
    if (dataType === 'phone') {
      // Add phoneConfig if provided (even if empty)
      if (phoneConfig !== undefined) {
        columnData.phoneConfig = phoneConfig;
      }
      // console.log('Backend: Creating phone column:', {
      //   dataType,
      //   name,
      //   hasPhoneConfig: !!phoneConfig,
      //   phoneConfig
      // });
    }

    // Time data type doesn't need special config, just basic validation
    if (dataType === 'time') {
      // Add timeConfig if provided (even if empty)
      if (timeConfig !== undefined) {
        columnData.timeConfig = timeConfig;
      }
      // console.log('Backend: Creating time column:', {
      //   dataType,
      //   name,
      //   hasTimeConfig: !!timeConfig,
      //   timeConfig
      // });
    }

    // Rating data type doesn't need special config, just basic validation
    if (dataType === 'rating') {
      // Add ratingConfig if provided (even if empty)
      if (ratingConfig !== undefined) {
        columnData.ratingConfig = ratingConfig;
      }
      // console.log('Backend: Creating rating column:', {
      //   dataType,
      //   name,
      //   hasRatingConfig: !!ratingConfig,
      //   ratingConfig
      // });
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
      // console.log('Backend: Creating linked_table column:', {
      //   dataType,
      //   name,
      //   hasLinkedTableConfig: !!linkedTableConfig,
      //   linkedTableConfig: columnData.linkedTableConfig
      // });
    }

    // Only add lookupConfig if dataType is lookup and lookupConfig is provided
    if (dataType === 'lookup' && lookupConfig) {
      // Ensure lookupConfig has all required fields with defaults
      columnData.lookupConfig = {
        linkedTableId: lookupConfig.linkedTableId,
        lookupColumnId: lookupConfig.lookupColumnId,
        linkedTableName: lookupConfig.linkedTableName || '',
        lookupColumnName: lookupConfig.lookupColumnName || '',
        defaultValue: lookupConfig.defaultValue || null
      };
      // console.log('Backend: Creating lookup column:', {
      //   dataType,
      //   name,
      //   hasLookupConfig: !!lookupConfig,
      //   lookupConfig: columnData.lookupConfig
      // });
    }

    // Set default value for currency column if not provided
    if (dataType === 'currency' && (columnData.defaultValue === undefined || columnData.defaultValue === null)) {
      columnData.defaultValue = 0;
    }

    // Set default value for percent column if not provided
    if (dataType === 'percent' && (columnData.defaultValue === undefined || columnData.defaultValue === null)) {
      columnData.defaultValue = 0;
    }


    // console.log('Column data to save:', columnData);

    // Create column in PostgreSQL
    const column = await PostgresColumn.create({
      name: columnData.name,
      key: columnData.key,
      type: columnData.type,
      table_id: tableId,
      user_id: userId,
      site_id: req.siteId?.toString(),
      data_type: columnData.dataType,
      is_required: columnData.isRequired || false,
      is_unique: columnData.isUnique || false,
      default_value: columnData.defaultValue,
      checkbox_config: columnData.checkboxConfig,
      single_select_config: columnData.singleSelectConfig,
      multi_select_config: columnData.multiSelectConfig,
      formula_config: columnData.formulaConfig,
      date_config: columnData.dateConfig,
      currency_config: columnData.currencyConfig,
      percent_config: columnData.percentConfig,
      url_config: columnData.urlConfig,
      phone_config: columnData.phoneConfig,
      time_config: columnData.timeConfig,
      rating_config: columnData.ratingConfig,
      linked_table_config: columnData.linkedTableConfig,
      lookup_config: columnData.lookupConfig,
      order: columnData.order || 0
    });

    console.log(`✅ Column created in PostgreSQL: ${column.name} (${column.id})`);

    // Tạo default permission cho column
    try {
      const ColumnPermission = (await import('../model/ColumnPermission.js')).default;
      const defaultPermission = new ColumnPermission({
        columnId: column.id,
        tableId: tableId,
        databaseId: databaseId,
        targetType: 'all_members',
        name: column.name, // Thêm field name required
        canView: true,
        canEdit: true,
        createdBy: userId,
        isDefault: true
      });
      await defaultPermission.save();
      // console.log('Default column permission created successfully');
    } catch (permissionError) {
      console.error('Error creating default column permission:', permissionError);
      // Không throw error để không ảnh hưởng đến việc tạo column
    }

    // Transform PostgreSQL column to match expected format
    const transformedColumn = {
      _id: column.id,
      name: column.name,
      key: column.key,
      type: column.type,
      tableId: column.table_id,
      userId: column.user_id,
      siteId: column.site_id,
      dataType: column.data_type,
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
    };

    res.status(201).json({
      success: true,
      message: 'Column created successfully',
      data: transformedColumn
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

    if (!tableId) {
      return res.status(400).json({ message: "Table ID is required" });
    }

    // Verify table exists and get its database info (check both MongoDB and PostgreSQL)
    const [mongoTable, postgresTable] = await Promise.all([
      Table.findOne({ _id: tableId }).populate('baseId'),
      PostgresTable.findByPk(tableId)
    ]);

    const table = mongoTable || postgresTable;
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Get database ID from either source
    const databaseId = mongoTable ? mongoTable.databaseId : postgresTable.database_id;

    // For PostgreSQL tables, we need to get the database info
    let orgId;
    if (mongoTable) {
      orgId = table.databaseId?.orgId;
    } else {
      // For PostgreSQL, we need to get the database from MongoDB to find orgId
      const database = await Database.findById(databaseId);
      orgId = database?.orgId;
    }

    if (!orgId) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Verify user is a member of the organization that owns this table's database
    const organization = await Organization.findOne({ 
      _id: orgId,
      'members.user': userId 
    });
    
    if (!organization) {
      return res.status(403).json({ message: "Access denied - user is not a member of this database" });
    }

    // Get columns from both MongoDB and PostgreSQL
    const [mongoColumns, postgresColumns] = await Promise.all([
      Column.find({ tableId }).sort({ order: 1 }),
      PostgresColumn.findAll({
        where: { table_id: tableId },
        order: [['order', 'ASC']]
      })
    ]);

    // Transform PostgreSQL columns to match MongoDB format
    const transformedPostgresColumns = postgresColumns.map(column => ({
      _id: column.id,
      name: column.name,
      key: column.key,
      type: column.type,
      tableId: column.table_id,
      userId: column.user_id,
      siteId: column.site_id,
      dataType: column.data_type,
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

    // Combine columns from both sources
    const allColumns = [...mongoColumns, ...transformedPostgresColumns];

    // Remove duplicates based on name (PostgreSQL takes precedence)
    const uniqueColumns = allColumns.reduce((acc, current) => {
      const existingIndex = acc.findIndex(column => column.name === current.name);
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        // Replace with PostgreSQL version if it exists
        if (current._id && !acc[existingIndex]._id.toString().includes('-')) {
          acc[existingIndex] = current;
        }
      }
      return acc;
    }, []);

    // Sort by order
    uniqueColumns.sort((a, b) => (a.order || 0) - (b.order || 0));

    res.status(200).json({
      success: true,
      data: uniqueColumns
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

    // Find column and populate table info
    const column = await Column.findById(columnId).populate('tableId');
    
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Check if user is a member of this database
    // Super admin có quyền update column trong mọi database
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: column.tableId.databaseId, 
        userId 
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }

      // Check if user has permission to edit this column
      if (baseMember.role === 'member') {
      // For members, check column permissions
      const ColumnPermission = (await import('../model/ColumnPermission.js')).default;
      
      const columnPermissions = await ColumnPermission.find({
        columnId: columnId,
        $or: [
          { targetType: 'all_members' },
          { targetType: 'specific_user', userId: userId },
          { targetType: 'specific_role', role: baseMember.role }
        ]
      });

      let canEditColumn = false;
      
      // Sort permissions by priority: specific_user > specific_role > all_members
      const sortedPermissions = columnPermissions.sort((a, b) => {
        const priority = { 'specific_user': 3, 'specific_role': 2, 'all_members': 1 };
        return (priority[b.targetType] || 0) - (priority[a.targetType] || 0);
      });
      
      // Check permissions in priority order
      for (const perm of sortedPermissions) {
        if (perm.canEdit !== undefined) {
          canEditColumn = perm.canEdit;
          // Stop at first permission found (highest priority)
          break;
        }
      }

      if (!canEditColumn) {
        return res.status(403).json({ message: 'Access denied - you do not have permission to edit this column' });
      }
    }
    }
    // Owners and managers can always edit columns

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
      // console.log(`Updating records: renaming column key from "${oldColumnName}" to "${name.trim()}"`);
      
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
      
      // console.log(`Successfully renamed column key in ${updatedCount} records from "${oldColumnName}" to "${name.trim()}"`);
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
      // console.log('Backend: Updating URL config:', {
      //   dataType,
      //   urlConfig,
      //   columnUrlConfig: column.urlConfig
      // });
    } else if (dataType !== 'url') {
      column.urlConfig = undefined;
    }

    // Phone data type doesn't need special config
    if (dataType === 'phone') {
      // Add phoneConfig if provided (even if empty)
      if (phoneConfig !== undefined) {
        column.phoneConfig = phoneConfig;
      }
      // console.log('Backend: Updating phone column:', {
      //   dataType,
      //   name,
      //   hasPhoneConfig: !!phoneConfig,
      //   phoneConfig
      // });
    }

    // Time data type doesn't need special config
    if (dataType === 'time') {
      // Add timeConfig if provided (even if empty)
      if (timeConfig !== undefined) {
        column.timeConfig = timeConfig;
      }
      // console.log('Backend: Updating time column:', {
      //   dataType,
      //   name,
      //   hasTimeConfig: !!timeConfig,
      //   timeConfig
      // });
    }

    // Rating data type doesn't need special config
    if (dataType === 'rating') {
      // Add ratingConfig if provided (even if empty)
      if (ratingConfig !== undefined) {
        column.ratingConfig = ratingConfig;
      }
      // console.log('Backend: Updating rating column:', {
      //   dataType,
      //   name,
      //   hasRatingConfig: !!ratingConfig,
      //   ratingConfig
      // });
    }

    // Linked table data type configuration
    if (dataType === 'linked_table' && linkedTableConfig !== undefined) {
      column.linkedTableConfig = linkedTableConfig;
      // console.log('Backend: Updating linked_table column:', {
      //   dataType,
      //   name,
      //   hasLinkedTableConfig: !!linkedTableConfig,
      //   linkedTableConfig
      // });
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

    // console.log('🔍 Backend: Query and Records:', {
    //   query: query,
    //   recordsCount: records.length,
    //   totalCount: totalCount,
    //   firstRecord: records[0] ? {
    //     _id: records[0]._id,
    //     tableId: records[0].tableId,
    //     data: records[0].data,
    //     dataKeys: Object.keys(records[0].data || {})
    //   } : null
    // });

    // Get linked table info
    const linkedTable = await Table.findOne({ _id: linkedTableId });

    // Get columns of the linked table
    const linkedTableColumns = await Column.find({
      tableId: linkedTableId,
      userId,
      siteId
    }).sort({ order: 1 });

    // console.log('🔍 getLinkedTableData Debug:', {
    //   columnId,
    //   linkedTableId,
    //   query,
    //   recordsCount: records.length,
    //   totalCount,
    //   linkedTable: linkedTable ? { _id: linkedTable._id, name: linkedTable.name } : null,
    //   linkedTableColumns: linkedTableColumns.map(col => ({ _id: col._id, name: col.name })),
    //   firstRecord: records[0] ? { _id: records[0]._id, data: records[0].data } : null,
    //   allRecordsData: records.map(r => ({ _id: r._id, dataKeys: Object.keys(r.data || {}) }))
    // });

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
        label: String(label),
        recordId: record._id,
        data: record.data
      };
    });

    // console.log('🔍 Backend: All records data:', records.map(record => ({
    //   _id: record._id,
    //   tableId: record.tableId,
    //   data: record.data,
    //   dataKeys: Object.keys(record.data || {}),
    //   dataEntries: Object.entries(record.data || {}).map(([key, val]) => ({ key, value: val }))
    // })));

    // console.log('🔍 Backend: Transformed options:', options.map(option => ({
    //   value: option.value,
    //   label: option.label,
    //   data: option.data,
    //   dataKeys: Object.keys(option.data || {})
    // })));

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

    // console.log(`Deleting column "${columnName}" and cleaning up data in all records`);

    // Remove the column data from all records in this table first
    await Record.updateMany(
      { tableId: tableId },
      {
        $unset: { [`data.${columnName}`]: "" }
      }
    );

    // Then delete column metadata
    await Column.deleteOne({ _id: columnId });

    // console.log(`Successfully deleted column "${columnName}" and removed data from all records`);

    res.status(200).json({
      success: true,
      message: `Column "${columnName}" deleted successfully. All data in this column has been removed.`
    });
  } catch (error) {
    console.error('Error deleting column:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get lookup data for a lookup column
export const getLookupData = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { search = '', page = 1, limit = 10 } = req.query;
    const userId = req.user._id;
    const siteId = req.siteId;

    // console.log('🔍 getLookupData called:', { columnId, search, page, limit });

    // Get the column
    const column = await Column.findOne({
      _id: columnId,
      userId,
      siteId
    });

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Check if it's a lookup column
    if (column.dataType !== 'lookup') {
      return res.status(400).json({ message: 'Column is not a lookup type' });
    }

    const lookupConfig = column.lookupConfig;
    if (!lookupConfig || !lookupConfig.linkedTableId || !lookupConfig.lookupColumnId) {
      return res.status(400).json({ message: 'Lookup configuration not found' });
    }

    // console.log('🔍 Lookup config:', lookupConfig);

    // Get the linked table
    const linkedTable = await Table.findById(lookupConfig.linkedTableId);
    if (!linkedTable) {
      return res.status(404).json({ message: 'Linked table not found' });
    }

    // Get the lookup column
    const lookupColumn = await Column.findById(lookupConfig.lookupColumnId);
    if (!lookupColumn) {
      return res.status(404).json({ message: 'Lookup column not found' });
    }

    // console.log('🔍 Linked table:', linkedTable.name);
    // console.log('🔍 Lookup column:', lookupColumn.name);

    // Build search query - search in all text fields
    let query = { tableId: lookupConfig.linkedTableId };
    
    if (search && search.trim()) {
      // Search in the specific lookup column
      const searchRegex = new RegExp(search.trim(), 'i');
      query[`data.${lookupColumn.name}`] = searchRegex;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch records with pagination
    const records = await Record.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalCount = await Record.countDocuments(query);

    // Get columns of the linked table for display
    const linkedTableColumns = await Column.find({
      tableId: lookupConfig.linkedTableId
    }).sort({ order: 1 });

    // Transform records into options
    const options = records.map((record, index) => {
      // Create a display label from the specific lookup column
      let label = `Record ${index + 1}`;
      
      // Try lookup column first
      const lookupValue = record.data?.[lookupColumn.name];
      if (lookupValue && String(lookupValue).trim()) {
        label = String(lookupValue);
      } else {
        // Fallback: create meaningful label
        const data = record.data || {};
        const priorityFields = ["Tên giao dịch", "Loại giao dịch", "chiến dịch", "Text 1"];
        
        for (const field of priorityFields) {
          if (data[field] && String(data[field]).trim()) {
            label = `${field}: ${String(data[field])}`;
            break;
          }
        }
      }

      return {
        value: record._id,
        label: String(label),
        data: record.data
      };
    });

    // console.log('🔍 Lookup data result:', {
    //   totalCount,
    //   optionsCount: options.length,
    //   linkedTable: linkedTable.name,
    //   linkedTableColumns: linkedTableColumns.length
    // });

    res.json({
      success: true,
      data: {
        options,
        totalCount,
        linkedTable: {
          _id: linkedTable._id,
          name: linkedTable.name
        },
        linkedTableColumns: linkedTableColumns.map(col => ({
          _id: col._id,
          name: col.name,
          dataType: col.dataType,
          order: col.order
        }))
      }
    });

  } catch (error) {
    console.error('Error getting lookup data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reorder columns
// Create column at specific position
export const createColumnAtPosition = async (req, res) => {
  try {
    const { tableId, position, referenceColumnId } = req.params;
    const { name, dataType, isRequired, isUnique, defaultValue, checkboxConfig, singleSelectConfig, multiSelectConfig, dateConfig, formulaConfig, currencyConfig, percentConfig, urlConfig, phoneConfig, timeConfig, ratingConfig, linkedTableConfig, lookupConfig } = req.body;
    const userId = req.user._id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Column name is required' });
    }

    if (!dataType) {
      return res.status(400).json({ message: 'Data type is required' });
    }

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    if (!position || !['left', 'right'].includes(position)) {
      return res.status(400).json({ message: 'Position must be "left" or "right"' });
    }

    if (!referenceColumnId) {
      return res.status(400).json({ message: 'Reference column ID is required' });
    }

    // Verify table exists and belongs to user
    // Try to find table by _id first, if fails try by other fields
    let table = await Table.findOne({
      _id: tableId
    }).populate('databaseId');
    
    // If not found by _id, try to find by other possible fields
    if (!table) {
      // Check if tableId might be a different field
      table = await Table.findOne({
        $or: [
          { name: tableId },
          { _id: tableId }
        ]
      }).populate('databaseId');
    }

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user is a member of the database
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({
        userId: userId,
        databaseId: table.databaseId._id
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }

      // Check if user has permission to edit table structure
      const canEditStructure = baseMember.role === 'owner' || baseMember.role === 'manager';
      if (!canEditStructure) {
        return res.status(403).json({ message: 'Access denied - you do not have permission to edit table structure' });
      }
    }

    // Verify reference column exists
    const referenceColumn = await Column.findOne({
      _id: referenceColumnId,
      tableId: tableId
    });

    if (!referenceColumn) {
      return res.status(404).json({ message: 'Reference column not found' });
    }

    const existingColumn = await Column.findOne({
      name: name.trim(),
      tableId
    });

    if (existingColumn) {
      return res.status(400).json({ message: 'Column with this name already exists in this table' });
    }

    // Calculate new order based on position
    let newOrder;
    if (position === 'left') {
      newOrder = referenceColumn.order;
      // Shift all columns with order >= referenceColumn.order to the right
      await Column.updateMany(
        { tableId: tableId, order: { $gte: referenceColumn.order } },
        { $inc: { order: 1 } }
      );
    } else { // position === 'right'
      newOrder = referenceColumn.order + 1;
      // Shift all columns with order > referenceColumn.order to the right
      await Column.updateMany(
        { tableId: tableId, order: { $gt: referenceColumn.order } },
        { $inc: { order: 1 } }
      );
    }

    // Prepare column data (same as createColumn)
    const columnData = {
      name: name.trim(),
      key: name.trim().toLowerCase().replace(/\s+/g, '_'),
      dataType,
      isRequired: isRequired || false,
      isUnique: isUnique || false,
      defaultValue,
      order: newOrder,
      tableId,
      userId,
      siteId: req.user?.site_id
    };

    // Add configs based on dataType (same logic as createColumn)
    if (dataType === 'checkbox' && checkboxConfig) {
      columnData.checkboxConfig = {
        icon: checkboxConfig.icon || 'check-circle',
        color: checkboxConfig.color || '#52c41a',
        defaultValue: checkboxConfig.defaultValue !== undefined ? checkboxConfig.defaultValue : false
      };
    }

    if (dataType === 'single_select' && singleSelectConfig) {
      columnData.singleSelectConfig = {
        options: singleSelectConfig.options || [],
        defaultValue: singleSelectConfig.defaultValue || ''
      };
    }

    if (dataType === 'multi_select' && multiSelectConfig) {
      columnData.multiSelectConfig = {
        options: multiSelectConfig.options || [],
        defaultValue: multiSelectConfig.defaultValue || []
      };
    }

    if (dataType === 'date' && dateConfig) {
      columnData.dateConfig = {
        format: dateConfig.format || 'DD/MM/YYYY',
        includeTime: dateConfig.includeTime || false,
        defaultValue: dateConfig.defaultValue || null
      };
    }

    if (dataType === 'formula' && formulaConfig) {
      columnData.formulaConfig = {
        formula: formulaConfig.formula || '',
        resultType: formulaConfig.resultType || 'text'
      };
    }

    if (dataType === 'currency' && currencyConfig) {
      columnData.currencyConfig = {
        currency: currencyConfig.currency || 'VND',
        symbol: currencyConfig.symbol || '₫',
        defaultValue: currencyConfig.defaultValue !== undefined ? currencyConfig.defaultValue : 0
      };
    }

    if (dataType === 'percent' && percentConfig) {
      columnData.percentConfig = {
        defaultValue: percentConfig.defaultValue !== undefined ? percentConfig.defaultValue : 0
      };
    }

    if (dataType === 'url' && urlConfig) {
      columnData.urlConfig = {
        protocol: urlConfig.protocol || 'https'
      };
    }

    if (dataType === 'phone' && phoneConfig !== undefined) {
      columnData.phoneConfig = phoneConfig;
    }

    if (dataType === 'time' && timeConfig !== undefined) {
      columnData.timeConfig = timeConfig;
    }

    if (dataType === 'rating' && ratingConfig) {
      columnData.ratingConfig = {
        maxRating: ratingConfig.maxRating || 5,
        icon: ratingConfig.icon || 'star',
        defaultValue: ratingConfig.defaultValue || 0
      };
    }

    if (dataType === 'linked_table' && linkedTableConfig) {
      columnData.linkedTableConfig = {
        linkedTableId: linkedTableConfig.linkedTableId,
        linkedTableName: linkedTableConfig.linkedTableName || '',
        displayColumnId: linkedTableConfig.displayColumnId,
        displayColumnName: linkedTableConfig.displayColumnName || '',
        defaultValue: linkedTableConfig.defaultValue || null
      };
    }

    if (dataType === 'lookup' && lookupConfig) {
      columnData.lookupConfig = {
        linkedTableId: lookupConfig.linkedTableId,
        lookupColumnId: lookupConfig.lookupColumnId,
        linkedTableName: lookupConfig.linkedTableName || '',
        lookupColumnName: lookupConfig.lookupColumnName || '',
        defaultValue: lookupConfig.defaultValue || null
      };
    }

    // Set default values
    if (dataType === 'currency' && (columnData.defaultValue === undefined || columnData.defaultValue === null)) {
      columnData.defaultValue = 0;
    }

    if (dataType === 'percent' && (columnData.defaultValue === undefined || columnData.defaultValue === null)) {
      columnData.defaultValue = 0;
    }

    const column = new Column(columnData);
    await column.save();

    // Create default permission for column
    try {
      const ColumnPermission = (await import('../model/ColumnPermission.js')).default;
      const defaultPermission = new ColumnPermission({
        columnId: column._id,
        tableId: tableId,
        databaseId: table.databaseId._id,
        targetType: 'all_members',
        name: column.name,
        canView: true,
        canEdit: true,
        createdBy: userId,
        isDefault: true
      });
      await defaultPermission.save();
    } catch (permissionError) {
      console.error('Error creating default column permission:', permissionError);
    }

    res.status(201).json({
      success: true,
      message: 'Column created successfully',
      column: column
    });

  } catch (error) {
    console.error('Error creating column at position:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const reorderColumns = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { columnOrders } = req.body; // Array of { columnId, order }
    const userId = req.user._id;

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    if (!columnOrders || !Array.isArray(columnOrders)) {
      return res.status(400).json({ message: 'Column orders array is required' });
    }

    // Verify table exists and belongs to user
    const table = await Table.findOne({
      _id: tableId
    }).populate('databaseId');

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if user is a member of the database
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({
        databaseId: table.databaseId._id,
        userId
      });

      if (!baseMember) {
        return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
      }

      // Check if user has permission to edit table structure
      if (baseMember.role === 'member') {
        const TablePermission = (await import('../model/TablePermission.js')).default;
        
        const tablePermissions = await TablePermission.find({
          tableId: tableId,
          $or: [
            { targetType: 'all_members' },
            { targetType: 'specific_user', userId: userId },
            { targetType: 'specific_role', role: baseMember.role }
          ]
        });

        let canEditStructure = false;
        
        const sortedPermissions = tablePermissions.sort((a, b) => {
          const priority = { 'specific_user': 3, 'specific_role': 2, 'all_members': 1 };
          return (priority[b.targetType] || 0) - (priority[a.targetType] || 0);
        });
        
        for (const perm of sortedPermissions) {
          if (perm.permissions && perm.permissions.canEditStructure !== undefined) {
            canEditStructure = perm.permissions.canEditStructure;
            break;
          }
        }

        if (!canEditStructure) {
          return res.status(403).json({ message: 'Access denied - you do not have permission to edit table structure' });
        }
      }
    }

    // Update column orders
    const updatePromises = columnOrders.map(({ columnId, order }) => {
      return Column.updateOne(
        { _id: columnId, tableId: tableId },
        { order: order }
      );
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Columns reordered successfully'
    });

  } catch (error) {
    console.error('Error reordering columns:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};
