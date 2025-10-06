import { sequelize } from './src/config/postgres.js';
import { Table, Column, Record } from './src/models/postgres/index.js';
import { createMetabaseTable, updateMetabaseTable } from './src/utils/metabaseTableCreator.js';

/**
 * Test Column Sync Functionality
 * 
 * This script tests whether the system automatically syncs record data
 * when columns are modified or deleted.
 */

async function testColumnSync() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
    
    console.log('\n🧪 TESTING COLUMN SYNC FUNCTIONALITY');
    console.log('=====================================');
    
    // Find a table with data to test
    const tables = await Table.findAll();
    let testTable = null;
    
    for (const table of tables) {
      const [columns, records] = await Promise.all([
        Column.findAll({ where: { table_id: table.id } }),
        Record.findAll({ where: { table_id: table.id } })
      ]);
      
      if (columns.length > 0 && records.length > 0) {
        testTable = table;
        console.log(`\n📋 Found test table: ${table.name} (ID: ${table.id})`);
        console.log(`   - Columns: ${columns.length}`);
        console.log(`   - Records: ${records.length}`);
        break;
      }
    }
    
    if (!testTable) {
      console.log('❌ No table with data found for testing');
      return;
    }
    
    // Get initial data
    const [initialColumns, initialRecords] = await Promise.all([
      Column.findAll({ where: { table_id: testTable.id } }),
      Record.findAll({ where: { table_id: testTable.id } })
    ]);
    
    console.log('\n📊 INITIAL STATE:');
    console.log(`   - Columns: ${initialColumns.map(c => c.name).join(', ')}`);
    console.log(`   - Sample record data:`, JSON.stringify(initialRecords[0]?.data || {}, null, 2));
    
    // Check initial Metabase table
    const expectedMetabaseTableName = `metabase_${testTable.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${testTable.id.slice(-8)}`;
    const [initialMetabaseTable] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = '${expectedMetabaseTableName}'
    `);
    
    if (initialMetabaseTable.length === 0) {
      console.log('❌ Metabase table not found, creating it...');
      const result = await createMetabaseTable(testTable.id, testTable.name, null, testTable.database_id);
      if (result.success) {
        console.log('✅ Metabase table created');
      } else {
        console.log('❌ Failed to create Metabase table:', result.error);
        return;
      }
    }
    
    // Get initial Metabase data
    const [initialMetabaseRecords] = await sequelize.query(`
      SELECT * FROM "public"."${expectedMetabaseTableName}" LIMIT 1
    `);
    
    console.log(`   - Initial Metabase record:`, JSON.stringify(initialMetabaseRecords[0] || {}, null, 2));
    
    // Test 1: Add a new column
    console.log('\n🧪 TEST 1: ADDING NEW COLUMN');
    console.log('=============================');
    
    const newColumnName = 'test_column_' + Date.now();
    const newColumn = await Column.create({
      name: newColumnName,
      key: newColumnName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      type: 'string',
      data_type: 'text',
      table_id: testTable.id,
      user_id: '68341e4d3f86f9c7ae46e962',
      site_id: '686d45a89a0a0c37366567c8',
      is_required: false,
      is_unique: false,
      default_value: null,
      order: initialColumns.length
    });
    
    console.log(`✅ Created new column: ${newColumnName}`);
    
    // Check if Metabase table was updated
    const [updatedMetabaseColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = '${expectedMetabaseTableName}'
      AND column_name NOT IN ('id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at')
      ORDER BY ordinal_position
    `);
    
    const hasNewColumn = updatedMetabaseColumns.some(col => col.column_name === newColumnName);
    if (hasNewColumn) {
      console.log('✅ Metabase table structure updated with new column');
    } else {
      console.log('❌ Metabase table structure NOT updated with new column');
    }
    
    // Test 2: Update column name
    console.log('\n🧪 TEST 2: RENAMING COLUMN');
    console.log('===========================');
    
    const oldColumnName = newColumnName;
    const newColumnName2 = 'renamed_column_' + Date.now();
    
    // Add some test data to the column first
    const testRecord = initialRecords[0];
    if (testRecord) {
      const updatedData = { ...testRecord.data };
      updatedData[oldColumnName] = 'test_value';
      await testRecord.update({ data: updatedData });
      console.log(`✅ Added test data to column: ${oldColumnName} = 'test_value'`);
    }
    
    // Rename the column
    await newColumn.update({ name: newColumnName2 });
    console.log(`✅ Renamed column: ${oldColumnName} → ${newColumnName2}`);
    
    // Check if record data was updated
    const updatedRecord = await Record.findByPk(testRecord.id);
    const hasOldData = updatedRecord.data[oldColumnName] !== undefined;
    const hasNewData = updatedRecord.data[newColumnName2] !== undefined;
    
    if (!hasOldData && hasNewData) {
      console.log('✅ Record data updated with new column name');
      console.log(`   - New data: ${updatedRecord.data[newColumnName2]}`);
    } else {
      console.log('❌ Record data NOT updated properly');
      console.log(`   - Has old data: ${hasOldData}`);
      console.log(`   - Has new data: ${hasNewData}`);
    }
    
    // Check if Metabase table was updated
    const [renamedMetabaseColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = '${expectedMetabaseTableName}'
      AND column_name NOT IN ('id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at')
      ORDER BY ordinal_position
    `);
    
    const hasOldColumnInMetabase = renamedMetabaseColumns.some(col => col.column_name === oldColumnName);
    const hasNewColumnInMetabase = renamedMetabaseColumns.some(col => col.column_name === newColumnName2);
    
    if (!hasOldColumnInMetabase && hasNewColumnInMetabase) {
      console.log('✅ Metabase table structure updated with renamed column');
    } else {
      console.log('❌ Metabase table structure NOT updated properly');
      console.log(`   - Has old column: ${hasOldColumnInMetabase}`);
      console.log(`   - Has new column: ${hasNewColumnInMetabase}`);
    }
    
    // Test 3: Delete column
    console.log('\n🧪 TEST 3: DELETING COLUMN');
    console.log('===========================');
    
    // Add data to the column before deleting
    if (testRecord) {
      const updatedData = { ...updatedRecord.data };
      updatedData[newColumnName2] = 'data_to_be_deleted';
      await updatedRecord.update({ data: updatedData });
      console.log(`✅ Added data to column before deletion: ${newColumnName2} = 'data_to_be_deleted'`);
    }
    
    // Delete the column
    await newColumn.destroy();
    console.log(`✅ Deleted column: ${newColumnName2}`);
    
    // Check if record data was cleaned up
    const finalRecord = await Record.findByPk(testRecord.id);
    const hasDeletedData = finalRecord.data[newColumnName2] !== undefined;
    
    if (!hasDeletedData) {
      console.log('✅ Record data cleaned up after column deletion');
    } else {
      console.log('❌ Record data NOT cleaned up after column deletion');
    }
    
    // Check if Metabase table was updated
    const [finalMetabaseColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = '${expectedMetabaseTableName}'
      AND column_name NOT IN ('id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at')
      ORDER BY ordinal_position
    `);
    
    const hasDeletedColumnInMetabase = finalMetabaseColumns.some(col => col.column_name === newColumnName2);
    
    if (!hasDeletedColumnInMetabase) {
      console.log('✅ Metabase table structure updated after column deletion');
    } else {
      console.log('❌ Metabase table structure NOT updated after column deletion');
    }
    
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log('✅ Column sync functionality has been tested');
    console.log('   - Add column: Tests if Metabase table structure is updated');
    console.log('   - Rename column: Tests if record data and Metabase structure are updated');
    console.log('   - Delete column: Tests if record data and Metabase structure are cleaned up');
    
    console.log('\n💡 NOTE: This test only checks the database level changes.');
    console.log('   For full functionality, the column controllers should be called via API endpoints.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testColumnSync().then(() => {
  console.log('\n🎯 Column sync test completed!');
  process.exit(0);
});

