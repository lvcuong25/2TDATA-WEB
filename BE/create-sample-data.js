import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });
dotenv.config();

console.log('🎯 Creating Sample Data for Migration Test...');
console.log('==============================================');

async function createSampleData() {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2TDATA');
    console.log('✅ MongoDB connected successfully');

    // Create schemas
    const BaseSchema = new mongoose.Schema({}, { strict: false });
    const TableSchema = new mongoose.Schema({}, { strict: false });
    const ColumnSchema = new mongoose.Schema({}, { strict: false });
    const RecordSchema = new mongoose.Schema({}, { strict: false });
    const RowSchema = new mongoose.Schema({}, { strict: false });
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const SiteSchema = new mongoose.Schema({}, { strict: false });

    const Base = mongoose.model('Base', BaseSchema);
    const Table = mongoose.model('Table', TableSchema);
    const Column = mongoose.model('Column', ColumnSchema);
    const Record = mongoose.model('Record', RecordSchema);
    const Row = mongoose.model('Row', RowSchema);
    const User = mongoose.model('User', UserSchema);
    const Site = mongoose.model('Site', SiteSchema);

    // Create sample user
    console.log('👤 Creating sample user...');
    const sampleUser = await User.create({
      _id: new mongoose.Types.ObjectId(),
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`✅ Created user: ${sampleUser.name} (${sampleUser._id})`);

    // Create sample site
    console.log('🌐 Creating sample site...');
    const sampleSite = await Site.create({
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Site',
      domain: 'test.example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`✅ Created site: ${sampleSite.name} (${sampleSite._id})`);

    // Create sample base
    console.log('🗄️ Creating sample base...');
    const sampleBase = await Base.create({
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Base',
      description: 'Sample base for migration testing',
      userId: sampleUser._id,
      siteId: sampleSite._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`✅ Created base: ${sampleBase.name} (${sampleBase._id})`);

    // Create sample table
    console.log('📊 Creating sample table...');
    const sampleTable = await Table.create({
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Table',
      baseId: sampleBase._id,
      userId: sampleUser._id,
      siteId: sampleSite._id,
      description: 'Sample table for migration testing',
      tableAccessRule: {
        userIds: [sampleUser._id.toString()],
        allUsers: false,
        access: ['read', 'write']
      },
      columnAccessRules: [],
      recordAccessRules: [],
      cellAccessRules: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`✅ Created table: ${sampleTable.name} (${sampleTable._id})`);

    // Create sample columns
    console.log('📋 Creating sample columns...');
    const columns = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Name',
        key: 'name',
        type: 'string',
        dataType: 'string',
        tableId: sampleTable._id,
        userId: sampleUser._id,
        siteId: sampleSite._id,
        isRequired: true,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Email',
        key: 'email',
        type: 'string',
        dataType: 'email',
        tableId: sampleTable._id,
        userId: sampleUser._id,
        siteId: sampleSite._id,
        isRequired: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Age',
        key: 'age',
        type: 'number',
        dataType: 'number',
        tableId: sampleTable._id,
        userId: sampleUser._id,
        siteId: sampleSite._id,
        isRequired: false,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const columnData of columns) {
      const column = await Column.create(columnData);
      console.log(`✅ Created column: ${column.name} (${column._id})`);
    }

    // Create sample records
    console.log('📝 Creating sample records...');
    const records = [
      {
        _id: new mongoose.Types.ObjectId(),
        tableId: sampleTable._id,
        userId: sampleUser._id,
        siteId: sampleSite._id,
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        tableId: sampleTable._id,
        userId: sampleUser._id,
        siteId: sampleSite._id,
        data: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          age: 25
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const recordData of records) {
      const record = await Record.create(recordData);
      console.log(`✅ Created record: ${record.data.name} (${record._id})`);
    }

    // Create sample rows
    console.log('📄 Creating sample rows...');
    const rows = [
      {
        _id: new mongoose.Types.ObjectId(),
        tableId: sampleTable._id,
        data: {
          name: 'Row 1',
          value: 'Sample data 1'
        },
        createdBy: sampleUser._id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        tableId: sampleTable._id,
        data: {
          name: 'Row 2',
          value: 'Sample data 2'
        },
        createdBy: sampleUser._id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const rowData of rows) {
      const row = await Row.create(rowData);
      console.log(`✅ Created row: ${row.data.name} (${row._id})`);
    }

    // Summary
    console.log('\n🎉 Sample data created successfully!');
    console.log('📊 Summary:');
    console.log(`   Users: 1`);
    console.log(`   Sites: 1`);
    console.log(`   Bases: 1`);
    console.log(`   Tables: 1`);
    console.log(`   Columns: 3`);
    console.log(`   Records: 2`);
    console.log(`   Rows: 2`);
    console.log('\n✅ Ready for migration testing!');

  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

createSampleData().catch(console.error);
