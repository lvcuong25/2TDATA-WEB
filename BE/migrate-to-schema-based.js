import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { createDatabaseSchema, migrateDatabaseToSchema, listDatabaseSchemas } from './src/services/schemaManager.js';
import dotenv from 'dotenv';

dotenv.config();

// Set environment variables for PostgreSQL
process.env.PG_DATABASE = process.env.POSTGRES_DB;
process.env.PG_USER = process.env.POSTGRES_USER;
process.env.PG_PASSWORD = process.env.POSTGRES_PASSWORD;
process.env.PG_HOST = process.env.POSTGRES_HOST;
process.env.PG_PORT = process.env.POSTGRES_PORT;

// Connect to databases
const connectDatabases = async () => {
  try {
    // MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ Connected to MongoDB');
    
    // PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

// Main migration function
const migrateToSchemaBased = async () => {
  try {
    console.log('🚀 Starting migration to schema-based structure...\n');
    
    // Get all databases/bases
    const Base = (await import('./src/model/Base.js')).default;
    const Database = (await import('./src/model/Database.js')).default;
    
    const [bases, databases] = await Promise.all([
      Base.find({}).lean(),
      Database.find({}).lean()
    ]);
    
    const allDatabases = [...bases, ...databases];
    console.log(`📋 Found ${allDatabases.length} databases to migrate`);
    
    if (allDatabases.length === 0) {
      console.log('⚠️ No databases found to migrate');
      return;
    }
    
    const migrationResults = [];
    
    for (const database of allDatabases) {
      try {
        console.log(`\n🔄 Migrating database: ${database.name} (${database._id})`);
        
        // Check if schema already exists
        const existingSchema = database.postgresSchema;
        if (existingSchema) {
          console.log(`✅ Schema already exists: ${existingSchema}`);
          migrationResults.push({
            databaseId: database._id,
            databaseName: database.name,
            success: true,
            message: 'Schema already exists',
            schemaName: existingSchema
          });
          continue;
        }
        
        // Migrate database to schema
        const result = await migrateDatabaseToSchema(database._id);
        
        if (result.success) {
          console.log(`✅ Migration successful for ${database.name}`);
          console.log(`   Schema: ${result.schemaName}`);
          console.log(`   Tables migrated: ${result.successCount}/${result.totalTables}`);
          
          migrationResults.push({
            databaseId: database._id,
            databaseName: database.name,
            success: true,
            schemaName: result.schemaName,
            tablesMigrated: result.successCount,
            totalTables: result.totalTables,
            results: result.results
          });
        } else {
          console.error(`❌ Migration failed for ${database.name}: ${result.error}`);
          migrationResults.push({
            databaseId: database._id,
            databaseName: database.name,
            success: false,
            error: result.error
          });
        }
        
      } catch (error) {
        console.error(`❌ Error migrating database ${database.name}:`, error);
        migrationResults.push({
          databaseId: database._id,
          databaseName: database.name,
          success: false,
          error: error.message
        });
      }
    }
    
    // Summary
    console.log('\n📊 Migration Summary:');
    const successCount = migrationResults.filter(r => r.success).length;
    const failCount = migrationResults.filter(r => !r.success).length;
    
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    
    if (failCount > 0) {
      console.log('\n❌ Failed migrations:');
      migrationResults
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   - ${r.databaseName}: ${r.error}`);
        });
    }
    
    // List all schemas after migration
    console.log('\n📁 All schemas after migration:');
    const schemas = await listDatabaseSchemas();
    schemas.forEach(schema => {
      console.log(`   - ${schema.schema_name}: ${schema.tableCount} tables`);
    });
    
    return migrationResults;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Rollback function (use with caution!)
const rollbackMigration = async () => {
  try {
    console.log('⚠️ Starting rollback of schema-based migration...\n');
    
    const schemas = await listDatabaseSchemas();
    console.log(`📋 Found ${schemas.length} schemas to rollback`);
    
    if (schemas.length === 0) {
      console.log('✅ No schemas found to rollback');
      return;
    }
    
    const rollbackResults = [];
    
    for (const schema of schemas) {
      try {
        console.log(`🔄 Rolling back schema: ${schema.schema_name}`);
        
        // Get all tables in this schema
        const [tables] = await sequelize.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = '${schema.schema_name}'
        `);
        
        // Move tables back to public schema
        for (const table of tables) {
          try {
            await sequelize.query(`ALTER TABLE "${schema.schema_name}"."${table.table_name}" SET SCHEMA public`);
            console.log(`   📦 Moved table: ${table.table_name} → public`);
          } catch (tableError) {
            console.error(`   ❌ Failed to move table ${table.table_name}:`, tableError.message);
          }
        }
        
        // Drop the schema
        await sequelize.query(`DROP SCHEMA IF EXISTS "${schema.schema_name}" CASCADE`);
        console.log(`   🗑️ Dropped schema: ${schema.schema_name}`);
        
        rollbackResults.push({
          schemaName: schema.schema_name,
          success: true,
          tablesMoved: tables.length
        });
        
      } catch (error) {
        console.error(`❌ Error rolling back schema ${schema.schema_name}:`, error);
        rollbackResults.push({
          schemaName: schema.schema_name,
          success: false,
          error: error.message
        });
      }
    }
    
    // Summary
    console.log('\n📊 Rollback Summary:');
    const successCount = rollbackResults.filter(r => r.success).length;
    const failCount = rollbackResults.filter(r => !r.success).length;
    
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    
    return rollbackResults;
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
};

// Test function to verify migration
const testMigration = async () => {
  try {
    console.log('🧪 Testing schema-based system...\n');
    
    // List all schemas
    const schemas = await listDatabaseSchemas();
    console.log(`📁 Found ${schemas.length} schemas:`);
    
    for (const schema of schemas) {
      console.log(`   - ${schema.schema_name}: ${schema.tableCount} tables`);
      
      // List tables in this schema
      const [tables] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schema.schema_name}'
        ORDER BY table_name
      `);
      
      tables.forEach(table => {
        console.log(`     └── ${table.table_name}`);
      });
    }
    
    // Test a few operations
    if (schemas.length > 0) {
      const testSchema = schemas[0];
      console.log(`\n🔍 Testing operations on schema: ${testSchema.schema_name}`);
      
      // Test table access
      const [testTables] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${testSchema.schema_name}'
        LIMIT 1
      `);
      
      if (testTables.length > 0) {
        const testTable = testTables[0];
        console.log(`   Testing table: ${testTable.table_name}`);
        
        // Test row count
        const [rowCount] = await sequelize.query(`
          SELECT COUNT(*) as count 
          FROM "${testSchema.schema_name}"."${testTable.table_name}"
        `);
        
        console.log(`   ✅ Row count: ${rowCount[0].count}`);
      }
    }
    
    console.log('\n✅ Schema-based system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

// Main execution function
const runMigration = async () => {
  try {
    await connectDatabases();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'migrate':
        await migrateToSchemaBased();
        break;
      case 'rollback':
        await rollbackMigration();
        break;
      case 'test':
        await testMigration();
        break;
      case 'list':
        const schemas = await listDatabaseSchemas();
        console.log('📁 Current schemas:');
        schemas.forEach(schema => {
          console.log(`   - ${schema.schema_name}: ${schema.tableCount} tables`);
        });
        break;
      default:
        console.log('Usage: node migrate-to-schema-based.js [migrate|rollback|test|list]');
        console.log('  migrate  - Migrate existing data to schema-based structure');
        console.log('  rollback - Rollback migration (move tables back to public schema)');
        console.log('  test     - Test the schema-based system');
        console.log('  list     - List all current schemas');
        break;
    }
    
    console.log('\n🎉 Operation completed successfully!');
    
  } catch (error) {
    console.error('💥 Operation failed:', error);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
    process.exit(0);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { migrateToSchemaBased, rollbackMigration, testMigration };
