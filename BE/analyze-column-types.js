import { sequelize } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });
dotenv.config();

console.log('🔍 Analyzing Column Types: FE vs BE vs PostgreSQL...');
console.log('====================================================');

async function analyzeColumnTypes() {
  try {
    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Frontend Column Types (from EditColumnModal.jsx)
    const frontendTypes = [
      'text', 'number', 'date', 'year', 'checkbox', 'single_select', 'multi_select',
      'formula', 'currency', 'percent', 'phone', 'time', 'rating', 'email', 'url',
      'linked_table', 'json', 'datetime'
    ];

    // Backend Column Types (from Column.js model)
    const backendTypes = [
      'string', 'number', 'date', 'year', 'text', 'email', 'url', 'json',
      'checkbox', 'single_select', 'multi_select', 'formula', 'currency',
      'percent', 'phone', 'time', 'rating', 'linked_table', 'lookup'
    ];

    // Migration Script Types (from migrate-all.js)
    const migrationTypes = [
      'string', 'number', 'date', 'boolean', 'json', 'text', 'email', 'url',
      'checkbox', 'single_select', 'multi_select', 'formula', 'currency',
      'percent', 'phone', 'time', 'rating', 'linked_table', 'lookup'
    ];

    console.log('\n📊 COLUMN TYPES COMPARISON:');
    console.log('============================');

    console.log('\n🎨 Frontend Types (' + frontendTypes.length + '):');
    frontendTypes.forEach((type, index) => {
      console.log(`   ${index + 1}. ${type}`);
    });

    console.log('\n🔧 Backend Types (' + backendTypes.length + '):');
    backendTypes.forEach((type, index) => {
      console.log(`   ${index + 1}. ${type}`);
    });

    console.log('\n🔄 Migration Types (' + migrationTypes.length + '):');
    migrationTypes.forEach((type, index) => {
      console.log(`   ${index + 1}. ${type}`);
    });

    // Find missing types
    const missingInBackend = frontendTypes.filter(type => !backendTypes.includes(type));
    const missingInMigration = frontendTypes.filter(type => !migrationTypes.includes(type));
    const extraInBackend = backendTypes.filter(type => !frontendTypes.includes(type));
    const extraInMigration = migrationTypes.filter(type => !frontendTypes.includes(type));

    console.log('\n❌ MISSING TYPES:');
    console.log('==================');

    if (missingInBackend.length > 0) {
      console.log('\n🚨 Missing in Backend:');
      missingInBackend.forEach(type => {
        console.log(`   • ${type}`);
      });
    }

    if (missingInMigration.length > 0) {
      console.log('\n🚨 Missing in Migration:');
      missingInMigration.forEach(type => {
        console.log(`   • ${type}`);
      });
    }

    if (extraInBackend.length > 0) {
      console.log('\n➕ Extra in Backend:');
      extraInBackend.forEach(type => {
        console.log(`   • ${type}`);
      });
    }

    if (extraInMigration.length > 0) {
      console.log('\n➕ Extra in Migration:');
      extraInMigration.forEach(type => {
        console.log(`   • ${type}`);
      });
    }

    // Check current PostgreSQL enum
    const enumResult = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'enum_columns_data_type'
      )
      ORDER BY enumsortorder
    `);

    const currentPostgresTypes = enumResult[0].map(row => row.enumlabel);
    console.log('\n🗄️ Current PostgreSQL Enum Types:');
    currentPostgresTypes.forEach((type, index) => {
      console.log(`   ${index + 1}. ${type}`);
    });

    // Check what's missing in PostgreSQL
    const missingInPostgres = frontendTypes.filter(type => !currentPostgresTypes.includes(type));
    if (missingInPostgres.length > 0) {
      console.log('\n🚨 Missing in PostgreSQL:');
      missingInPostgres.forEach(type => {
        console.log(`   • ${type}`);
      });
    }

    // Check actual data in columns table
    const columnsResult = await sequelize.query(`
      SELECT data_type, COUNT(*) as count
      FROM columns
      GROUP BY data_type
      ORDER BY count DESC
    `);

    console.log('\n📊 ACTUAL DATA IN COLUMNS TABLE:');
    console.log('=================================');
    if (columnsResult[0].length > 0) {
      columnsResult[0].forEach(row => {
        console.log(`   • ${row.data_type}: ${row.count} columns`);
      });
    } else {
      console.log('   No data found in columns table');
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    
    if (missingInBackend.length > 0 || missingInMigration.length > 0) {
      console.log('\n🔧 1. Update Backend Models:');
      console.log('   - Add missing types to Column.js model');
      console.log('   - Update migration scripts');
      console.log('   - Update PostgreSQL enum');
    }

    console.log('\n🎯 2. Metabase Optimization:');
    console.log('   - Update create-metabase-tables.js to handle all types');
    console.log('   - Add proper data type mapping for visualization');
    console.log('   - Consider type-specific formatting');

    console.log('\n🔄 3. Migration Strategy:');
    console.log('   - Re-run migration with updated types');
    console.log('   - Update existing Metabase tables');
    console.log('   - Test with all column types');

    // Generate updated enum SQL
    const allTypes = [...new Set([...frontendTypes, ...backendTypes])].sort();
    console.log('\n📝 UPDATED ENUM SQL:');
    console.log('====================');
    console.log('DROP TYPE IF EXISTS "public"."enum_columns_data_type";');
    console.log('CREATE TYPE "public"."enum_columns_data_type" AS ENUM(');
    console.log('  ' + allTypes.map(type => `'${type}'`).join(',\n  '));
    console.log(');');

  } catch (error) {
    console.error('❌ Error analyzing column types:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

analyzeColumnTypes().catch(console.error);
