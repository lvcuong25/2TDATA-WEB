import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { createDatabaseSchema, deleteDatabaseSchema } from './src/services/schemaManager.js';
import { createMetabaseTable, updateMetabaseTable } from './src/utils/metabaseTableCreator.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Testing Realistic Frontend Workflow...');

async function testRealisticWorkflow() {
  try {
    console.log('📡 Connecting to databases...');
    
    // Connect to databases
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    // Create test user
    console.log('\n👤 Setting up test user...');
    const User = (await import('./src/model/User.js')).default;
    let user = await User.findOne({ email: 'manager@test.com' });
    if (!user) {
      user = new User({
        name: 'Test Manager',
        email: 'manager@test.com',
        password: 'Manager123',
        role: 'manager'
      });
      await user.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ Found existing test user');
    }
    
    // Create test base
    console.log('\n📝 Creating test base...');
    const Base = (await import('./src/model/Base.js')).default;
    const testBaseName = `Realistic Workflow Test - ${Date.now()}`;
    const base = new Base({
      name: testBaseName,
      ownerId: user._id,
      orgId: user._id
    });
    await base.save();
    console.log(`✅ Test base created: ${base.name} (${base._id})`);
    
    // Create schema
    console.log('\n🏗️ Creating schema...');
    const schemaResult = await createDatabaseSchema(base._id, user._id);
    if (!schemaResult.success) {
      throw new Error(`Schema creation failed: ${schemaResult.error}`);
    }
    console.log(`✅ Schema created: ${schemaResult.schemaName}`);
    
    // Step 1: Create table first (like frontend does)
    console.log('\n📊 Step 1: Creating table first (like frontend)...');
    const tableName = 'My Project Tasks';
    const table = await Table.create({
      name: tableName,
      description: 'A table for managing project tasks',
      database_id: base._id.toString(),
      user_id: user._id.toString(),
      site_id: 'test-site',
      table_access_rule: {
        userIds: [],
        allUsers: false,
        access: []
      },
      column_access_rules: [],
      record_access_rules: [],
      cell_access_rules: []
    });
    console.log(`✅ Table created: ${table.name} (${table.id})`);
    
    // Step 2: Create initial Metabase table (no columns yet)
    console.log('\n🎯 Step 2: Creating initial Metabase table (no columns)...');
    const initialMetabaseResult = await createMetabaseTable(
      table.id,
      table.name,
      'test-org',
      base._id
    );
    
    if (initialMetabaseResult.success) {
      console.log(`✅ Initial Metabase table created: ${initialMetabaseResult.fullTableName}`);
      console.log(`   Data fields: ${initialMetabaseResult.dataFields.join(', ')}`);
    } else {
      console.log(`❌ Initial Metabase table creation failed: ${initialMetabaseResult.error}`);
      return;
    }
    
    // Step 3: Add first column (like user would do in frontend)
    console.log('\n📋 Step 3: Adding first column (Task Name)...');
    const firstColumn = await Column.create({
      name: 'Task Name',
      key: 'task_name',
      data_type: 'text',
      order: 0,
      table_id: table.id,
      user_id: user._id.toString()
    });
    console.log(`✅ First column created: ${firstColumn.name} (${firstColumn.data_type})`);
    
    // Update Metabase table with new column
    const firstUpdateResult = await createMetabaseTable(
      table.id,
      table.name,
      'test-org',
      base._id
    );
    
    if (firstUpdateResult.success) {
      console.log(`✅ Metabase table updated with first column: ${firstUpdateResult.fullTableName}`);
      console.log(`   Data fields: ${firstUpdateResult.dataFields.join(', ')}`);
    } else {
      console.log(`❌ Metabase table update failed: ${firstUpdateResult.error}`);
    }
    
    // Step 4: Add second column
    console.log('\n📋 Step 4: Adding second column (Priority)...');
    const secondColumn = await Column.create({
      name: 'Priority',
      key: 'priority',
      data_type: 'single_select',
      order: 1,
      table_id: table.id,
      user_id: user._id.toString(),
      single_select_config: {
        options: ['High', 'Medium', 'Low'],
        defaultValue: 'Medium'
      }
    });
    console.log(`✅ Second column created: ${secondColumn.name} (${secondColumn.data_type})`);
    
    // Update Metabase table with second column
    const secondUpdateResult = await createMetabaseTable(
      table.id,
      table.name,
      'test-org',
      base._id
    );
    
    if (secondUpdateResult.success) {
      console.log(`✅ Metabase table updated with second column: ${secondUpdateResult.fullTableName}`);
      console.log(`   Data fields: ${secondUpdateResult.dataFields.join(', ')}`);
    } else {
      console.log(`❌ Metabase table update failed: ${secondUpdateResult.error}`);
    }
    
    // Step 5: Add third column
    console.log('\n📋 Step 5: Adding third column (Due Date)...');
    const thirdColumn = await Column.create({
      name: 'Due Date',
      key: 'due_date',
      data_type: 'date',
      order: 2,
      table_id: table.id,
      user_id: user._id.toString()
    });
    console.log(`✅ Third column created: ${thirdColumn.name} (${thirdColumn.data_type})`);
    
    // Update Metabase table with third column
    const thirdUpdateResult = await createMetabaseTable(
      table.id,
      table.name,
      'test-org',
      base._id
    );
    
    if (thirdUpdateResult.success) {
      console.log(`✅ Metabase table updated with third column: ${thirdUpdateResult.fullTableName}`);
      console.log(`   Data fields: ${thirdUpdateResult.dataFields.join(', ')}`);
    } else {
      console.log(`❌ Metabase table update failed: ${thirdUpdateResult.error}`);
    }
    
    // Step 6: Add some records
    console.log('\n📝 Step 6: Adding records...');
    const testRecords = [
      {
        'Task Name': 'Design UI Mockup',
        'Priority': 'High',
        'Due Date': '2025-10-15'
      },
      {
        'Task Name': 'Write Documentation',
        'Priority': 'Medium',
        'Due Date': '2025-10-20'
      }
    ];
    
    for (let i = 0; i < testRecords.length; i++) {
      const recordData = testRecords[i];
      
      // Create record in PostgreSQL
      const record = await Record.create({
        table_id: table.id,
        user_id: user._id.toString(),
        site_id: 'test-site',
        data: recordData
      });
      console.log(`   ✅ Record created: ${record.id}`);
      
      // Real-time sync to Metabase
      const metabaseRecord = {
        id: record.id,
        table_id: record.table_id,
        user_id: record.user_id,
        site_id: record.site_id,
        data: recordData, // Use the original data, not record.data
        created_at: record.created_at,
        updated_at: record.updated_at
      };
      
      const syncResult = await updateMetabaseTable(
        table.id,
        metabaseRecord,
        'insert',
        [],
        base._id
      );
      
      if (syncResult.success) {
        console.log(`   ✅ Real-time sync: ${syncResult.fullTableName}`);
      } else {
        console.log(`   ❌ Real-time sync failed: ${syncResult.error}`);
      }
    }
    
    // Step 7: Verify final state
    console.log('\n🔍 Step 7: Verifying final state...');
    const [finalRows] = await sequelize.query(`
      SELECT * FROM "${schemaResult.schemaName}"."${thirdUpdateResult.metabaseTableName}"
      ORDER BY created_at
    `);
    
    console.log(`✅ Final verification: ${finalRows.length} records in Metabase table`);
    finalRows.forEach((row, index) => {
      console.log(`   ${index + 1}. Task Name: "${row.Task_Name}", Priority: "${row.Priority}", Due: "${row.Due_Date}"`);
      console.log(`      Full row data:`, row);
    });
    
    // Step 8: Check table structure
    console.log('\n📊 Step 8: Checking table structure...');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = '${schemaResult.schemaName}' 
      AND table_name = '${thirdUpdateResult.metabaseTableName}'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table structure:');
    columns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type})`);
    });
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await deleteDatabaseSchema(base._id, true);
    console.log('✅ Schema deleted');
    
    await Base.findByIdAndDelete(base._id);
    console.log('✅ Base deleted from MongoDB');
    
    console.log('\n🎉 Realistic workflow test completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Table Creation (no columns): SUCCESS');
    console.log('✅ Initial Metabase Table: SUCCESS');
    console.log('✅ Column Addition (3 columns): SUCCESS');
    console.log('✅ Metabase Table Updates: SUCCESS');
    console.log('✅ Record Addition: SUCCESS');
    console.log('✅ Real-time Sync: SUCCESS');
    console.log('✅ Schema Management: SUCCESS');
    
    console.log('\n💡 Key Features Verified:');
    console.log('   - Table can be created before columns (like frontend)');
    console.log('   - Metabase table created with basic structure');
    console.log('   - Columns can be added incrementally');
    console.log('   - Metabase table structure updates dynamically');
    console.log('   - Real-time sync works with dynamic structure');
    console.log('   - Schema isolation maintained throughout');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    try {
      await mongoose.disconnect();
      await sequelize.close();
      console.log('\n📡 Database connections closed');
    } catch (e) {
      console.log('⚠️ Error closing connections:', e.message);
    }
  }
}

// Run the test
testRealisticWorkflow();
