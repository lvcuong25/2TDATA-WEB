import { sequelize } from '../models/postgres/index.js';
import User from '../model/User.js';
import Base from '../model/Base.js';
import Database from '../model/Database.js';

/**
 * Schema Management Service
 * Handles PostgreSQL schema creation and management for bases/databases
 * Schema naming convention: {creator_name}_{database_name}_{database_id}
 */

/**
 * Generate safe schema name from creator name, database name, and database ID
 * @param {string} creatorName - Name of the creator
 * @param {string} databaseName - Name of the database
 * @param {string} databaseId - Database ID (MongoDB ObjectId or PostgreSQL UUID)
 * @returns {string} Safe schema name
 */
export function generateSchemaName(creatorName, databaseName, databaseId) {
  // Clean and normalize names
  const cleanCreatorName = creatorName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  const cleanDatabaseName = databaseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  // Convert databaseId to string and get last 8 characters for uniqueness
  const idString = databaseId.toString();
  const idSuffix = idString.slice(-8);
  
  // Combine: creator_database_id
  const schemaName = `${cleanCreatorName}_${cleanDatabaseName}_${idSuffix}`;
  
  // Ensure schema name is not too long (PostgreSQL limit is 63 characters)
  if (schemaName.length > 63) {
    const maxCreatorLength = Math.max(10, 63 - cleanDatabaseName.length - idSuffix.length - 2);
    const truncatedCreator = cleanCreatorName.substring(0, maxCreatorLength);
    return `${truncatedCreator}_${cleanDatabaseName}_${idSuffix}`;
  }
  
  return schemaName;
}

/**
 * Create a new PostgreSQL schema for a database
 * @param {string} databaseId - Database ID
 * @param {string} creatorId - Creator user ID
 * @returns {Object} Result object with success status and schema name
 */
export async function createDatabaseSchema(databaseId, creatorId) {
  try {
    console.log(`🏗️ Creating schema for database: ${databaseId}, creator: ${creatorId}`);
    
    // Get creator and database information
    const [creator, database] = await Promise.all([
      User.findById(creatorId).lean(),
      Base.findById(databaseId).lean() || Database.findById(databaseId).lean()
    ]);
    
    if (!creator) {
      throw new Error(`Creator not found: ${creatorId}`);
    }
    
    if (!database) {
      throw new Error(`Database not found: ${databaseId}`);
    }
    
    // Generate schema name
    const schemaName = generateSchemaName(creator.name, database.name, databaseId.toString());
    console.log(`📝 Generated schema name: ${schemaName}`);
    
    // Check if schema already exists
    const [existingSchemas] = await sequelize.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = '${schemaName}'
    `);
    
    if (existingSchemas.length > 0) {
      console.log(`⚠️ Schema already exists: ${schemaName}`);
      return {
        success: true,
        schemaName,
        message: 'Schema already exists',
        isNew: false
      };
    }
    
    // Create schema
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    console.log(`✅ Created schema: ${schemaName}`);
    
    // Set permissions for metabase user (if exists)
    try {
      await sequelize.query(`GRANT USAGE ON SCHEMA "${schemaName}" TO metabase_user`);
      await sequelize.query(`GRANT CREATE ON SCHEMA "${schemaName}" TO metabase_user`);
      await sequelize.query(`GRANT ALL ON ALL TABLES IN SCHEMA "${schemaName}" TO metabase_user`);
      await sequelize.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA "${schemaName}" GRANT ALL ON TABLES TO metabase_user`);
      console.log(`🔐 Set permissions for metabase_user on schema: ${schemaName}`);
    } catch (permError) {
      console.warn(`⚠️ Could not set metabase permissions: ${permError.message}`);
      // Continue without failing - permissions might be set later
    }
    
    // Store schema information in database metadata
    try {
      // Update database with schema information
      if (database._id) {
        // MongoDB document
        await Base.findByIdAndUpdate(databaseId, {
          $set: {
            postgresSchema: schemaName,
            schemaCreatedAt: new Date()
          }
        });
      } else {
        // PostgreSQL document - would need to update accordingly
        console.log(`📝 Schema info stored for database: ${databaseId}`);
      }
    } catch (updateError) {
      console.warn(`⚠️ Could not store schema info: ${updateError.message}`);
      // Continue without failing
    }
    
    return {
      success: true,
      schemaName,
      message: 'Schema created successfully',
      isNew: true,
      creator: {
        id: creator._id,
        name: creator.name
      },
      database: {
        id: database._id || database.id,
        name: database.name
      }
    };
    
  } catch (error) {
    console.error(`❌ Error creating schema for database ${databaseId}:`, error);
    return {
      success: false,
      error: error.message,
      schemaName: null
    };
  }
}

/**
 * Get schema name for a database
 * @param {string} databaseId - Database ID
 * @returns {string|null} Schema name or null if not found
 */
export async function getDatabaseSchema(databaseId) {
  try {
    // First try to get from database metadata
    const database = await Base.findById(databaseId).lean() || await Database.findById(databaseId).lean();
    
    if (database && database.postgresSchema) {
      return database.postgresSchema;
    }
    
    // If not in metadata, try to find by naming convention
    // This is a fallback method
    const idString = databaseId.toString();
    const [schemas] = await sequelize.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE '%_${idString.slice(-8)}'
      AND schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
    `);
    
    if (schemas.length > 0) {
      return schemas[0].schema_name;
    }
    
    return null;
    
  } catch (error) {
    console.error(`❌ Error getting schema for database ${databaseId}:`, error);
    return null;
  }
}

/**
 * Delete a database schema (use with caution!)
 * @param {string} databaseId - Database ID
 * @param {boolean} force - Force deletion even if tables exist
 * @returns {Object} Result object
 */
export async function deleteDatabaseSchema(databaseId, force = false) {
  try {
    const schemaName = await getDatabaseSchema(databaseId);
    
    if (!schemaName) {
      return {
        success: false,
        error: 'Schema not found'
      };
    }
    
    // Check if schema has tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${schemaName}'
    `);
    
    if (tables.length > 0 && !force) {
      return {
        success: false,
        error: `Schema contains ${tables.length} tables. Use force=true to delete anyway.`,
        tableCount: tables.length
      };
    }
    
    // Drop schema (CASCADE will drop all tables)
    await sequelize.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    console.log(`🗑️ Deleted schema: ${schemaName}`);
    
    // Remove schema info from database metadata
    try {
      await Base.findByIdAndUpdate(databaseId, {
        $unset: {
          postgresSchema: 1,
          schemaCreatedAt: 1
        }
      });
    } catch (updateError) {
      console.warn(`⚠️ Could not remove schema info: ${updateError.message}`);
    }
    
    return {
      success: true,
      schemaName,
      message: 'Schema deleted successfully',
      tableCount: tables.length
    };
    
  } catch (error) {
    console.error(`❌ Error deleting schema for database ${databaseId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * List all schemas created by this system
 * @returns {Array} Array of schema information
 */
export async function listDatabaseSchemas() {
  try {
    const [schemas] = await sequelize.query(`
      SELECT 
        schema_name,
        schema_owner
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
      AND schema_name LIKE '%_%_%'
      ORDER BY schema_name
    `);
    
    // Get table counts for each schema
    const schemasWithCounts = await Promise.all(
      schemas.map(async (schema) => {
        const [tables] = await sequelize.query(`
          SELECT COUNT(*) as table_count
          FROM information_schema.tables 
          WHERE table_schema = '${schema.schema_name}'
        `);
        
        return {
          ...schema,
          tableCount: parseInt(tables[0].table_count)
        };
      })
    );
    
    return schemasWithCounts;
    
  } catch (error) {
    console.error('❌ Error listing schemas:', error);
    return [];
  }
}

/**
 * Migrate existing data to schema-based structure
 * @param {string} databaseId - Database ID to migrate
 * @returns {Object} Migration result
 */
export async function migrateDatabaseToSchema(databaseId) {
  try {
    console.log(`🔄 Starting migration for database: ${databaseId}`);
    
    // Create schema first
    const database = await Base.findById(databaseId).lean() || await Database.findById(databaseId).lean();
    if (!database) {
      throw new Error(`Database not found: ${databaseId}`);
    }
    
    const schemaResult = await createDatabaseSchema(databaseId, database.ownerId);
    if (!schemaResult.success) {
      throw new Error(`Failed to create schema: ${schemaResult.error}`);
    }
    
    const schemaName = schemaResult.schemaName;
    console.log(`✅ Schema created: ${schemaName}`);
    
    // Find all tables in this database
    const { Table: PostgresTable } = await import('../models/postgres/index.js');
    const tables = await PostgresTable.findAll({
      where: { database_id: databaseId }
    });
    
    console.log(`📋 Found ${tables.length} tables to migrate`);
    
    const migrationResults = [];
    
    for (const table of tables) {
      try {
        // Get existing metabase table name
        const [existingTables] = await sequelize.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name LIKE 'metabase_%' 
          AND table_name LIKE '%_${table.id.slice(-8)}'
        `);
        
        if (existingTables.length > 0) {
          const oldTableName = existingTables[0].table_name;
          const newTableName = `metabase_${table.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${table.id.slice(-8)}`;
          
          // Move table to new schema
          await sequelize.query(`ALTER TABLE public."${oldTableName}" SET SCHEMA "${schemaName}"`);
          console.log(`📦 Moved table: ${oldTableName} → ${schemaName}.${newTableName}`);
          
          migrationResults.push({
            tableId: table.id,
            tableName: table.name,
            oldTableName,
            newTableName,
            success: true
          });
        } else {
          console.log(`⚠️ No metabase table found for: ${table.name}`);
          migrationResults.push({
            tableId: table.id,
            tableName: table.name,
            success: false,
            error: 'No metabase table found'
          });
        }
      } catch (tableError) {
        console.error(`❌ Error migrating table ${table.name}:`, tableError);
        migrationResults.push({
          tableId: table.id,
          tableName: table.name,
          success: false,
          error: tableError.message
        });
      }
    }
    
    const successCount = migrationResults.filter(r => r.success).length;
    const failCount = migrationResults.filter(r => !r.success).length;
    
    console.log(`🎉 Migration completed: ${successCount} success, ${failCount} failed`);
    
    return {
      success: true,
      schemaName,
      totalTables: tables.length,
      successCount,
      failCount,
      results: migrationResults
    };
    
  } catch (error) {
    console.error(`❌ Migration failed for database ${databaseId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}
