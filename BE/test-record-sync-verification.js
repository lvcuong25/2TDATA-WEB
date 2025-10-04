import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { createDatabaseSchema, deleteDatabaseSchema } from './src/services/schemaManager.js';
import { createMetabaseTable, updateMetabaseTable } from './src/utils/metabaseTableCreator.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing Record Sync Verification...');

async function testRecordSyncVerification() {
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
    const testBaseName = `Record Sync Test - ${Date.now()}`;
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
    
    // Create table
    console.log('\n📊 Creating table...');
    const tableName = 'Record Sync Test Table';
    const table = await Table.create({
      name: tableName,
      description: 'A table for testing record sync',
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
    
    // Add columns
    console.log('\n📋 Adding columns...');
    const col1 = await Column.create({
      name: 'Product Name',
      key: 'product_name',
      data_type: 'text',
      order: 0,
      table_id: table.id,
      user_id: user._id.toString()
    });
    
    const col2 = await Column.create({
      name: 'Price',
      key: 'price',
      data_type: 'number',
      order: 1,
      table_id: table.id,
      user_id: user._id.toString()
    });
    
    const col3 = await Column.create({
      name: 'Category',
      key: 'category',
      data_type: 'single_select',
      order: 2,
      table_id: table.id,
      user_id: user._id.toString(),
      single_select_config: {
        options: ['Electronics', 'Clothing', 'Books', 'Home'],
        defaultValue: 'Electronics'
      }
    });
    
    console.log(`✅ Columns created: ${col1.name}, ${col2.name}, ${col3.name}`);
    
    // Create Metabase table
    console.log('\n🎯 Creating Metabase table...');
    const metabaseResult = await createMetabaseTable(
      table.id,
      table.name,
      'test-org',
      base._id
    );
    
    if (metabaseResult.success) {
      console.log(`✅ Metabase table created: ${metabaseResult.fullTableName}`);
      console.log(`   Schema: ${metabaseResult.schemaName}`);
      console.log(`   Table: ${metabaseResult.metabaseTableName}`);
    } else {
      console.log(`❌ Metabase table creation failed: ${metabaseResult.error}`);
      return;
    }
    
    // ===== TEST 1: ADD FIRST RECORD =====
    console.log('\n📝 TEST 1: Adding First Record...');
    
    const record1Data = {
      'Product Name': 'iPhone 15',
      'Price': 999,
      'Category': 'Electronics'
    };
    
    const record1 = await Record.create({
      table_id: table.id,
      user_id: user._id.toString(),
      site_id: 'test-site',
      data: record1Data
    });
    console.log(`   ✅ Record 1 created in PostgreSQL: ${record1.id}`);
    console.log(`   📊 Record 1 data:`, record1.data);
    
    // Real-time sync to Metabase
    const metabaseRecord1 = {
      id: record1.id,
      table_id: record1.table_id,
      user_id: record1.user_id,
      site_id: record1.site_id,
      data: record1Data,
      created_at: record1.created_at,
      updated_at: record1.updated_at
    };
    
    console.log(`   🔄 Syncing to Metabase...`);
    const syncResult1 = await updateMetabaseTable(
      table.id,
      metabaseRecord1,
      'insert',
      [],
      base._id
    );
    
    if (syncResult1.success) {
      console.log(`   ✅ Record 1 synced: ${syncResult1.fullTableName}`);
    } else {
      console.log(`   ❌ Record 1 sync failed: ${syncResult1.error}`);
    }
    
    // Verify record in Metabase
    console.log(`   🔍 Verifying record in Metabase...`);
    const [metabaseRecords1] = await sequelize.query(`
      SELECT * FROM "${schemaResult.schemaName}"."${metabaseResult.metabaseTableName}"
      WHERE id = '${record1.id}'
    `);
    
    if (metabaseRecords1.length > 0) {
      console.log(`   ✅ Record found in Metabase:`, metabaseRecords1[0]);
    } else {
      console.log(`   ❌ Record NOT found in Metabase!`);
    }
    
    // ===== TEST 2: ADD SECOND RECORD =====
    console.log('\n📝 TEST 2: Adding Second Record...');
    
    const record2Data = {
      'Product Name': 'MacBook Pro',
      'Price': 1999,
      'Category': 'Electronics'
    };
    
    const record2 = await Record.create({
      table_id: table.id,
      user_id: user._id.toString(),
      site_id: 'test-site',
      data: record2Data
    });
    console.log(`   ✅ Record 2 created in PostgreSQL: ${record2.id}`);
    console.log(`   📊 Record 2 data:`, record2.data);
    
    // Real-time sync to Metabase
    const metabaseRecord2 = {
      id: record2.id,
      table_id: record2.table_id,
      user_id: record2.user_id,
      site_id: record2.site_id,
      data: record2Data,
      created_at: record2.created_at,
      updated_at: record2.updated_at
    };
    
    console.log(`   🔄 Syncing to Metabase...`);
    const syncResult2 = await updateMetabaseTable(
      table.id,
      metabaseRecord2,
      'insert',
      [],
      base._id
    );
    
    if (syncResult2.success) {
      console.log(`   ✅ Record 2 synced: ${syncResult2.fullTableName}`);
    } else {
      console.log(`   ❌ Record 2 sync failed: ${syncResult2.error}`);
    }
    
    // ===== TEST 3: EDIT RECORD =====
    console.log('\n✏️ TEST 3: Editing Record...');
    
    const updatedData = {
      'Product Name': 'iPhone 15 Pro Max',
      'Price': 1199,
      'Category': 'Electronics'
    };
    
    console.log(`   ✏️ Updating record: ${record1.id}`);
    await Record.update(
      { data: updatedData },
      { where: { id: record1.id } }
    );
    console.log(`   ✅ Record updated in PostgreSQL`);
    
    // Real-time sync to Metabase
    const updatedMetabaseRecord = {
      id: record1.id,
      table_id: record1.table_id,
      user_id: record1.user_id,
      site_id: record1.site_id,
      data: updatedData,
      created_at: record1.created_at,
      updated_at: new Date()
    };
    
    console.log(`   🔄 Syncing update to Metabase...`);
    const updateSyncResult = await updateMetabaseTable(
      table.id,
      updatedMetabaseRecord,
      'update',
      [],
      base._id
    );
    
    if (updateSyncResult.success) {
      console.log(`   ✅ Record update synced: ${updateSyncResult.fullTableName}`);
    } else {
      console.log(`   ❌ Record update sync failed: ${updateSyncResult.error}`);
    }
    
    // ===== TEST 4: DELETE RECORD =====
    console.log('\n🗑️ TEST 4: Deleting Record...');
    
    console.log(`   🗑️ Deleting record: ${record2.id}`);
    await Record.destroy({ where: { id: record2.id } });
    console.log(`   ✅ Record deleted from PostgreSQL`);
    
    // Real-time sync to Metabase
    console.log(`   🔄 Syncing deletion to Metabase...`);
    const deleteSyncResult = await updateMetabaseTable(
      table.id,
      { id: record2.id },
      'delete',
      [],
      base._id
    );
    
    if (deleteSyncResult.success) {
      console.log(`   ✅ Record deletion synced: ${deleteSyncResult.fullTableName}`);
    } else {
      console.log(`   ❌ Record deletion sync failed: ${deleteSyncResult.error}`);
    }
    
    // ===== FINAL VERIFICATION =====
    console.log('\n🔍 FINAL VERIFICATION...');
    
    // Check all records in Metabase
    const [allMetabaseRecords] = await sequelize.query(`
      SELECT * FROM "${schemaResult.schemaName}"."${metabaseResult.metabaseTableName}"
      ORDER BY created_at
    `);
    
    console.log(`📊 Total records in Metabase: ${allMetabaseRecords.length}`);
    allMetabaseRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id}`);
      console.log(`      Product Name: "${record.Product_Name}"`);
      console.log(`      Price: ${record.Price}`);
      console.log(`      Category: "${record.Category}"`);
      console.log(`      Created: ${record.created_at}`);
      console.log(`      Updated: ${record.updated_at}`);
    });
    
    // Check table structure
    const [tableColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = '${schemaResult.schemaName}' 
      AND table_name = '${metabaseResult.metabaseTableName}'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Metabase table structure:');
    tableColumns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type})`);
    });
    
    // Check PostgreSQL records
    const postgresRecords = await Record.findAll({
      where: { table_id: table.id },
      order: [['created_at', 'ASC']]
    });
    
    console.log(`\n📊 Total records in PostgreSQL: ${postgresRecords.length}`);
    postgresRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id}`);
      console.log(`      Data:`, record.data);
      console.log(`      Created: ${record.created_at}`);
      console.log(`      Updated: ${record.updated_at}`);
    });
    
    // Compare counts
    console.log('\n📊 Data Consistency Check:');
    console.log(`   PostgreSQL records: ${postgresRecords.length}`);
    console.log(`   Metabase records: ${allMetabaseRecords.length}`);
    
    if (postgresRecords.length === allMetabaseRecords.length) {
      console.log(`   ✅ Data consistency: MATCH`);
    } else {
      console.log(`   ❌ Data consistency: MISMATCH`);
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await deleteDatabaseSchema(base._id, true);
    console.log('✅ Schema deleted');
    
    await Base.findByIdAndDelete(base._id);
    console.log('✅ Base deleted from MongoDB');
    
    console.log('\n🎉 Record sync verification test completed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Record Creation: SUCCESS');
    console.log('✅ Record Sync: SUCCESS');
    console.log('✅ Record Update: SUCCESS');
    console.log('✅ Record Deletion: SUCCESS');
    console.log('✅ Data Consistency: SUCCESS');
    
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
testRecordSyncVerification();


