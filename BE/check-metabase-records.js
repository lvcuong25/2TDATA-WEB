import mongoose from 'mongoose';
import { sequelize, Table, Column, Record } from './src/models/postgres/index.js';
import { createDatabaseSchema, getDatabaseSchema } from './src/services/schemaManager.js';
import { createMetabaseTable, updateMetabaseTable } from './src/utils/metabaseTableCreator.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Checking Metabase Records...');

async function checkMetabaseRecords() {
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
    const testBaseName = `Metabase Check - ${Date.now()}`;
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
    const tableName = 'Products';
    const table = await Table.create({
      name: tableName,
      description: 'A products table for Metabase testing',
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
    } else {
      console.log(`❌ Metabase table creation failed: ${metabaseResult.error}`);
      return;
    }
    
    // Add sample records
    console.log('\n📝 Adding sample records...');
    const sampleRecords = [
      {
        'Product Name': 'iPhone 15',
        'Price': 999,
        'Category': 'Electronics'
      },
      {
        'Product Name': 'MacBook Pro',
        'Price': 1999,
        'Category': 'Electronics'
      },
      {
        'Product Name': 'Nike Air Max',
        'Price': 120,
        'Category': 'Clothing'
      },
      {
        'Product Name': 'JavaScript Guide',
        'Price': 45,
        'Category': 'Books'
      }
    ];
    
    const records = [];
    for (let i = 0; i < sampleRecords.length; i++) {
      const recordData = sampleRecords[i];
      
      const record = await Record.create({
        table_id: table.id,
        user_id: user._id.toString(),
        site_id: 'test-site',
        data: recordData
      });
      records.push(record);
      console.log(`   ✅ Record ${i + 1} created: ${record.id}`);
      
      // Real-time sync to Metabase
      const metabaseRecord = {
        id: record.id,
        table_id: record.table_id,
        user_id: record.user_id,
        site_id: record.site_id,
        data: recordData,
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
        console.log(`   ✅ Record ${i + 1} synced to Metabase`);
      } else {
        console.log(`   ❌ Record ${i + 1} sync failed: ${syncResult.error}`);
      }
    }
    
    // ===== DISPLAY METABASE INFORMATION =====
    console.log('\n🎯 METABASE TABLE INFORMATION:');
    console.log('=' .repeat(60));
    
    console.log(`📊 Schema Name: ${schemaResult.schemaName}`);
    console.log(`📊 Table Name: ${metabaseResult.metabaseTableName}`);
    console.log(`📊 Full Table Name: ${metabaseResult.fullTableName}`);
    
    // Query all records from Metabase
    const [metabaseRecords] = await sequelize.query(`
      SELECT * FROM "${schemaResult.schemaName}"."${metabaseResult.metabaseTableName}"
      ORDER BY created_at
    `);
    
    console.log(`\n📊 Total Records in Metabase: ${metabaseRecords.length}`);
    console.log('=' .repeat(60));
    
    metabaseRecords.forEach((record, index) => {
      console.log(`\n📝 Record ${index + 1}:`);
      console.log(`   ID: ${record.id}`);
      console.log(`   Product Name: "${record.Product_Name}"`);
      console.log(`   Price: ${record.Price}`);
      console.log(`   Category: "${record.Category}"`);
      console.log(`   Created: ${record.created_at}`);
      console.log(`   Updated: ${record.updated_at}`);
    });
    
    // Display table structure
    const [tableColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = '${schemaResult.schemaName}' 
      AND table_name = '${metabaseResult.metabaseTableName}'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Metabase Table Structure:');
    console.log('=' .repeat(60));
    tableColumns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });
    
    // ===== METABASE CONNECTION INFO =====
    console.log('\n🔗 METABASE CONNECTION INFORMATION:');
    console.log('=' .repeat(60));
    console.log('To view this data in Metabase:');
    console.log('');
    console.log('1. Open Metabase UI');
    console.log('2. Go to Admin > Databases');
    console.log('3. Add new PostgreSQL database with these settings:');
    console.log(`   - Host: localhost (or your PostgreSQL host)`);
    console.log(`   - Port: 5432 (or your PostgreSQL port)`);
    console.log(`   - Database: 2tdata (or your database name)`);
    console.log(`   - Username: your PostgreSQL username`);
    console.log(`   - Password: your PostgreSQL password`);
    console.log('');
    console.log('4. After connecting, you should see:');
    console.log(`   - Schema: ${schemaResult.schemaName}`);
    console.log(`   - Table: ${metabaseResult.metabaseTableName}`);
    console.log('');
    console.log('5. To query the data, use this SQL:');
    console.log(`   SELECT * FROM "${schemaResult.schemaName}"."${metabaseResult.metabaseTableName}";`);
    console.log('');
    console.log('6. Or browse the table directly in Metabase UI');
    
    // ===== DIRECT SQL QUERIES =====
    console.log('\n💻 DIRECT SQL QUERIES:');
    console.log('=' .repeat(60));
    console.log('You can also run these queries directly in PostgreSQL:');
    console.log('');
    console.log('-- List all schemas:');
    console.log('SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN (\'information_schema\', \'pg_catalog\', \'pg_toast\');');
    console.log('');
    console.log('-- List tables in our schema:');
    console.log(`SELECT table_name FROM information_schema.tables WHERE table_schema = '${schemaResult.schemaName}';`);
    console.log('');
    console.log('-- Query our data:');
    console.log(`SELECT * FROM "${schemaResult.schemaName}"."${metabaseResult.metabaseTableName}";`);
    console.log('');
    console.log('-- Count records:');
    console.log(`SELECT COUNT(*) FROM "${schemaResult.schemaName}"."${metabaseResult.metabaseTableName}";`);
    
    // ===== KEEP DATA FOR INSPECTION =====
    console.log('\n🔍 DATA PERSISTENCE:');
    console.log('=' .repeat(60));
    console.log('This test data will be kept for inspection:');
    console.log(`- Base ID: ${base._id}`);
    console.log(`- Table ID: ${table.id}`);
    console.log(`- Schema: ${schemaResult.schemaName}`);
    console.log(`- Metabase Table: ${metabaseResult.metabaseTableName}`);
    console.log('');
    console.log('To clean up later, run:');
    console.log(`- DELETE FROM "${schemaResult.schemaName}"."${metabaseResult.metabaseTableName}";`);
    console.log(`- DROP SCHEMA "${schemaResult.schemaName}" CASCADE;`);
    
    console.log('\n🎉 Metabase records check completed!');
    console.log('\n📊 Summary:');
    console.log(`✅ Schema created: ${schemaResult.schemaName}`);
    console.log(`✅ Metabase table created: ${metabaseResult.metabaseTableName}`);
    console.log(`✅ Records added: ${records.length}`);
    console.log(`✅ Records synced: ${metabaseRecords.length}`);
    console.log('✅ Data ready for Metabase inspection');
    
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
checkMetabaseRecords();



