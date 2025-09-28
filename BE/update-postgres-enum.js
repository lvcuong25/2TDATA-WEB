import { sequelize } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });
dotenv.config();

console.log('🔄 Updating PostgreSQL Enum for Column Types...');
console.log('===============================================');

async function updatePostgresEnum() {
  try {
    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Check current enum values
    const currentEnumResult = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'enum_columns_data_type'
      )
      ORDER BY enumsortorder
    `);

    const currentValues = currentEnumResult[0].map(row => row.enumlabel);
    console.log('📋 Current enum values:', currentValues);

    // Check if datetime is missing
    if (!currentValues.includes('datetime')) {
      console.log('➕ Adding "datetime" to enum...');
      
      // Add datetime to the enum
      await sequelize.query(`
        ALTER TYPE "public"."enum_columns_data_type" 
        ADD VALUE 'datetime'
      `);
      
      console.log('✅ Added "datetime" to enum');
    } else {
      console.log('✅ "datetime" already exists in enum');
    }

    // Verify the update
    const updatedEnumResult = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'enum_columns_data_type'
      )
      ORDER BY enumsortorder
    `);

    const updatedValues = updatedEnumResult[0].map(row => row.enumlabel);
    console.log('📋 Updated enum values:', updatedValues);

    // Check if all frontend types are covered
    const frontendTypes = [
      'text', 'number', 'date', 'datetime', 'year', 'checkbox', 'single_select', 
      'multi_select', 'formula', 'currency', 'percent', 'phone', 'time', 'rating', 
      'email', 'url', 'linked_table', 'json', 'lookup'
    ];

    const missingTypes = frontendTypes.filter(type => !updatedValues.includes(type));
    if (missingTypes.length > 0) {
      console.log('⚠️ Missing types in enum:', missingTypes);
    } else {
      console.log('✅ All frontend types are covered in PostgreSQL enum');
    }

    console.log('\n🎉 PostgreSQL enum update completed!');

  } catch (error) {
    console.error('❌ Error updating PostgreSQL enum:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

updatePostgresEnum().catch(console.error);
