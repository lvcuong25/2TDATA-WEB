import { sequelize, Table, Column, Record } from '../models/postgres/index.js';
import TableMongo from '../model/Table.js';
import ColumnMongo from '../model/Column.js';
import RecordMongo from '../model/Record.js';

/**
 * Create a Metabase-optimized table for a given table
 * @param {string} tableId - The table ID (can be from MongoDB or PostgreSQL)
 * @param {string} tableName - The table name
 * @param {string} organizationId - The organization ID for metabase sync
 */
export async function createMetabaseTable(tableId, tableName, organizationId) {
  try {
    console.log(`🎯 Creating Metabase table for: ${tableName} (${tableId})`);
    
    // Check if tableId is MongoDB ObjectId or PostgreSQL UUID
    const isMongoObjectId = tableId.length === 24 && /^[0-9a-fA-F]{24}$/.test(tableId);
    const isPostgresUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tableId);
    
    let mongoTable = null, postgresTable = null;
    let mongoColumns = [], postgresColumns = [];
    let mongoRecords = [], postgresRecords = [];
    
    // Get data based on tableId format
    if (isMongoObjectId) {
      // MongoDB ObjectId - get from MongoDB
      [mongoTable, mongoColumns, mongoRecords] = await Promise.all([
        TableMongo.findById(tableId),
        ColumnMongo.find({ tableId }),
        RecordMongo.find({ tableId })
      ]);
    } else if (isPostgresUUID) {
      // PostgreSQL UUID - get from PostgreSQL
      [postgresTable, postgresColumns, postgresRecords] = await Promise.all([
        Table.findByPk(tableId),
        Column.findAll({ where: { table_id: tableId } }),
        Record.findAll({ where: { table_id: tableId } })
      ]);
    } else {
      // Try both (fallback)
      try {
        [mongoTable, postgresTable] = await Promise.all([
          isMongoObjectId ? TableMongo.findById(tableId) : null,
          Table.findByPk(tableId)
        ]);
        
        [mongoColumns, postgresColumns] = await Promise.all([
          isMongoObjectId ? ColumnMongo.find({ tableId }) : [],
          Column.findAll({ where: { table_id: tableId } })
        ]);
        
        [mongoRecords, postgresRecords] = await Promise.all([
          isMongoObjectId ? RecordMongo.find({ tableId }) : [],
          Record.findAll({ where: { table_id: tableId } })
        ]);
      } catch (error) {
        console.log('⚠️ Error in fallback data retrieval:', error.message);
        // Continue with empty arrays
      }
    }
    
    // Combine data from both sources
    const allColumns = [...mongoColumns, ...postgresColumns.map(col => ({
      _id: col.id,
      name: col.name,
      dataType: col.data_type,
      tableId: col.table_id
    }))];
    
    const allRecords = [...mongoRecords, ...postgresRecords.map(rec => ({
      _id: rec.id,
      id: rec.id,  // Add id field for Metabase
      tableId: rec.table_id,
      table_id: rec.table_id,  // Add table_id field for Metabase
      userId: rec.user_id,
      user_id: rec.user_id,  // Add user_id field for Metabase
      siteId: rec.site_id,
      site_id: rec.site_id,  // Add site_id field for Metabase
      data: rec.data,
      createdAt: rec.created_at,
      created_at: rec.created_at,  // Add created_at field for Metabase
      updatedAt: rec.updated_at,
      updated_at: rec.updated_at  // Add updated_at field for Metabase
    }))];
    
    // Remove duplicates (PostgreSQL takes precedence)
    const uniqueColumns = allColumns.reduce((acc, current) => {
      const existingIndex = acc.findIndex(col => col.name === current.name);
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        if (current._id && !acc[existingIndex]._id.toString().includes('-')) {
          acc[existingIndex] = current;
        }
      }
      return acc;
    }, []);
    
    const uniqueRecords = allRecords.reduce((acc, current) => {
      const existingIndex = acc.findIndex(rec => 
        JSON.stringify(rec.data) === JSON.stringify(current.data) &&
        rec.tableId === current.tableId
      );
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        if (current._id && !acc[existingIndex]._id.toString().includes('-')) {
          acc[existingIndex] = current;
        }
      }
      return acc;
    }, []);
    
    // Generate safe table name for Metabase
    const safeTableName = `metabase_${tableName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${tableId.slice(-8)}`;
    
    // Map column types to PostgreSQL types for Metabase
    function mapMetabaseColumnType(dataType) {
      const typeMap = {
        'text': 'TEXT',
        'number': 'NUMERIC',
        'date': 'DATE',
        'datetime': 'TIMESTAMP WITH TIME ZONE',
        'year': 'INTEGER',
        'checkbox': 'BOOLEAN',
        'single_select': 'TEXT',
        'multi_select': 'TEXT[]',
        'formula': 'TEXT',
        'currency': 'NUMERIC(15,2)',
        'percent': 'NUMERIC(5,2)',
        'phone': 'TEXT',
        'time': 'TIME',
        'rating': 'INTEGER',
        'email': 'TEXT',
        'url': 'TEXT',
        'default': 'TEXT'
      };
      return typeMap[dataType] || typeMap['default'];
    }

    // Format value for Metabase insertion
    function formatValueForMetabase(value, dataType) {
      if (value === null || value === undefined) return null;
      
      switch (dataType) {
        case 'date':
          return value instanceof Date ? value.toISOString().split('T')[0] : value;
        case 'datetime':
          return value instanceof Date ? value.toISOString() : value;
        case 'number':
        case 'currency':
        case 'percent':
        case 'rating':
        case 'year':
          return parseFloat(value) || null;
        case 'checkbox':
          return Boolean(value);
        default:
          return String(value);
      }
    }

    // Get unique data fields from records
    const dataFields = new Set();
    uniqueRecords.forEach(record => {
      if (record.data && typeof record.data === 'object') {
        Object.keys(record.data).forEach(key => dataFields.add(key));
      }
    });

    // Add columns from column definitions
    uniqueColumns.forEach(column => {
      if (column.name) {
        dataFields.add(column.name);
      }
    });

    const dataFieldsArray = Array.from(dataFields);
    console.log(`📊 Data fields found: ${dataFieldsArray.join(', ')}`);

    // Create table SQL
    let createTableSQL = `CREATE TABLE "${safeTableName}" (
      id VARCHAR(255) PRIMARY KEY,
      table_id VARCHAR(255),
      user_id VARCHAR(255),
      site_id VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE`;

    // Add data columns
    dataFieldsArray.forEach(field => {
      const column = uniqueColumns.find(col => col.name === field);
      const dataType = column ? column.dataType : 'text';
      const pgType = mapMetabaseColumnType(dataType);
      const safeFieldName = field.replace(/[^a-zA-Z0-9_]/g, '_');
      createTableSQL += `,\n      "${safeFieldName}" ${pgType}`;
    });

    createTableSQL += '\n    )';

    // Drop table if exists
    await sequelize.query(`DROP TABLE IF EXISTS "${safeTableName}" CASCADE`);
    
    // Create table
    await sequelize.query(createTableSQL);
    console.log(`✅ Created Metabase table: ${safeTableName}`);

    // Insert records if any
    if (uniqueRecords.length > 0) {
      console.log(`📦 Migrating ${uniqueRecords.length} records...`);
      
      for (const record of uniqueRecords) {
        const values = {
          id: record.id,
          table_id: record.table_id,
          user_id: record.user_id,
          site_id: record.site_id,
          created_at: record.created_at,
          updated_at: record.updated_at
        };
        
        console.log(`   Debug - Record values:`, values);

        // Add data values
        dataFieldsArray.forEach(field => {
          const column = uniqueColumns.find(col => col.name === field);
          const dataType = column ? column.dataType : 'text';
          const safeFieldName = field.replace(/[^a-zA-Z0-9_]/g, '_');
          values[safeFieldName] = formatValueForMetabase(record.data?.[field], dataType);
        });

        // Build INSERT query - include required fields and non-null data fields
        const requiredFields = ['id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at'];
        const nonNullValues = {};
        
        // Always include required fields
        requiredFields.forEach(field => {
          if (values[field] !== null && values[field] !== undefined) {
            nonNullValues[field] = values[field];
          }
        });
        
        // Include non-null data fields
        Object.keys(values).forEach(key => {
          if (!requiredFields.includes(key) && values[key] !== null && values[key] !== undefined && values[key] !== '') {
            nonNullValues[key] = values[key];
          }
        });
        
        if (Object.keys(nonNullValues).length === 0) {
          console.log('⚠️ Skipping record with no valid values');
          continue;
        }
        
        const columnsList = Object.keys(nonNullValues).map(col => `"${col}"`).join(', ');
        const valuesList = Object.values(nonNullValues).map(val => 
          val === null ? 'NULL' : 
          typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` :
          val instanceof Date ? `'${val.toISOString()}'` :
          val
        ).join(', ');

        const insertSQL = `INSERT INTO "${safeTableName}" (${columnsList}) VALUES (${valuesList})`;
        await sequelize.query(insertSQL);
      }
      
      console.log(`✅ Migrated ${uniqueRecords.length} records to ${safeTableName}`);
    }

    // Create indexes (replace dashes with underscores for index names)
    const safeIndexName = safeTableName.replace(/-/g, '_');
    const indexQueries = [
      `CREATE INDEX idx_${safeIndexName}_table_id ON "${safeTableName}" (table_id)`,
      `CREATE INDEX idx_${safeIndexName}_user_id ON "${safeTableName}" (user_id)`,
      `CREATE INDEX idx_${safeIndexName}_site_id ON "${safeTableName}" (site_id)`
    ];

    for (const indexQuery of indexQueries) {
      await sequelize.query(indexQuery);
    }
    
    console.log(`✅ Created indexes for ${safeTableName}`);

    return {
      success: true,
      metabaseTableName: safeTableName,
      dataFields: dataFieldsArray,
      recordCount: uniqueRecords.length,
      columnCount: uniqueColumns.length
    };

  } catch (error) {
    console.error(`❌ Error creating Metabase table for ${tableName}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update Metabase table when records are added/updated
 * @param {string} tableId - The table ID
 * @param {Object} record - The record object
 * @param {string} operation - 'insert', 'update', or 'delete'
 * @param {Array} columns - Array of column objects (optional)
 */
export async function updateMetabaseTable(tableId, record, operation = 'insert', columns = []) {
  try {
    // Format value for Metabase insertion
    function formatValueForMetabase(value, dataType) {
      if (value === null || value === undefined) return null;
      
      switch (dataType) {
        case 'date':
          return value instanceof Date ? value.toISOString().split('T')[0] : value;
        case 'datetime':
          return value instanceof Date ? value.toISOString() : value;
        case 'number':
        case 'currency':
        case 'percent':
        case 'rating':
        case 'year':
          return parseFloat(value) || null;
        case 'checkbox':
          return Boolean(value);
        default:
          return String(value);
      }
    }
    // Find the Metabase table name
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'metabase_%' 
      AND table_name LIKE '%_${tableId.slice(-8)}'
    `);

    if (results.length === 0) {
      console.log(`⚠️ No Metabase table found for table ID: ${tableId}`);
      return { success: false, message: 'No Metabase table found' };
    }

    const metabaseTableName = results[0].table_name;
    console.log(`🔄 Updating Metabase table: ${metabaseTableName} (${operation})`);

    if (operation === 'delete') {
      await sequelize.query(`DELETE FROM "${metabaseTableName}" WHERE id = '${record.id}'`);
      console.log(`✅ Deleted record from ${metabaseTableName}`);
    } else {
      // For insert/update, we need to get the full record data
      let fullRecord = record;
      
      // If we don't have full record data, fetch it from PostgreSQL
      if (!record.data || Object.keys(record.data).length === 0) {
        const postgresRecord = await Record.findByPk(record.id);
        if (postgresRecord) {
          fullRecord = {
            id: postgresRecord.id,
            table_id: postgresRecord.table_id,
            user_id: postgresRecord.user_id,
            site_id: postgresRecord.site_id,
            data: postgresRecord.data,
            created_at: postgresRecord.created_at,
            updated_at: postgresRecord.updated_at
          };
        }
      }
      
      // Get columns if not provided
      let recordColumns = columns;
      if (recordColumns.length === 0) {
        // Check if tableId is MongoDB ObjectId or PostgreSQL UUID
        const isMongoObjectId = tableId.length === 24 && /^[0-9a-fA-F]{24}$/.test(tableId);
        const isPostgresUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tableId);
        
        let mongoColumns = [], postgresColumns = [];
        
        if (isMongoObjectId) {
          // MongoDB ObjectId - get from MongoDB
          mongoColumns = await ColumnMongo.find({ tableId });
        } else if (isPostgresUUID) {
          // PostgreSQL UUID - get from PostgreSQL
          postgresColumns = await Column.findAll({ where: { table_id: tableId } });
        } else {
          // Try both (fallback)
          try {
            [mongoColumns, postgresColumns] = await Promise.all([
              isMongoObjectId ? ColumnMongo.find({ tableId }) : [],
              Column.findAll({ where: { table_id: tableId } })
            ]);
          } catch (error) {
            console.log('⚠️ Error in fallback column retrieval:', error.message);
            // Continue with empty arrays
          }
        }
        
        recordColumns = [...mongoColumns, ...postgresColumns.map(col => ({
          _id: col.id,
          name: col.name,
          dataType: col.data_type,
          tableId: col.table_id
        }))];
      }
      
      // Get unique data fields
      const dataFields = new Set();
      if (fullRecord.data && typeof fullRecord.data === 'object') {
        Object.keys(fullRecord.data).forEach(key => dataFields.add(key));
      }
      recordColumns.forEach(column => {
        if (column.name) {
          dataFields.add(column.name);
        }
      });
      
      const dataFieldsArray = Array.from(dataFields);
      
      // Build values object
      const values = {
        id: fullRecord.id,
        table_id: fullRecord.table_id,
        user_id: fullRecord.user_id,
        site_id: fullRecord.site_id,
        created_at: fullRecord.created_at,
        updated_at: fullRecord.updated_at
      };
      
      // Add data values
      dataFieldsArray.forEach(field => {
        const column = recordColumns.find(col => col.name === field);
        const dataType = column ? column.dataType : 'text';
        const safeFieldName = field.replace(/[^a-zA-Z0-9_]/g, '_');
        values[safeFieldName] = formatValueForMetabase(fullRecord.data?.[field], dataType);
      });
      
      // Build UPSERT query (INSERT ... ON CONFLICT UPDATE) - only include non-null values
      const nonNullValues = {};
      Object.keys(values).forEach(key => {
        if (values[key] !== null && values[key] !== undefined && values[key] !== '') {
          nonNullValues[key] = values[key];
        }
      });
      
      // Always include required fields (id is required for UPSERT)
      if (values.id) {
        nonNullValues.id = values.id;
      }
      
      if (Object.keys(nonNullValues).length === 0) {
        console.log('⚠️ Skipping record with no valid values');
        return { success: false, error: 'No valid values to insert' };
      }
      
      const columnsList = Object.keys(nonNullValues).map(col => `"${col}"`).join(', ');
      const valuesList = Object.values(nonNullValues).map(val => 
        val === null ? 'NULL' : 
        typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` :
        val instanceof Date ? `'${val.toISOString()}'` :
        val
      ).join(', ');
      
      const updateClause = Object.keys(nonNullValues)
        .filter(key => key !== 'id')
        .map(key => `"${key}" = EXCLUDED."${key}"`)
        .join(', ');
      
      const upsertSQL = `
        INSERT INTO "${metabaseTableName}" (${columnsList}) 
        VALUES (${valuesList})
        ON CONFLICT (id) 
        DO UPDATE SET ${updateClause}
      `;
      
      await sequelize.query(upsertSQL);
      console.log(`✅ ${operation === 'insert' ? 'Inserted' : 'Updated'} record in ${metabaseTableName}`);
    }

    return { success: true, metabaseTableName };

  } catch (error) {
    console.error(`❌ Error updating Metabase table:`, error);
    return { success: false, error: error.message };
  }
}
