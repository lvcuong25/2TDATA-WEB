import mongoose from 'mongoose';
import { isOwner } from './src/utils/ownerUtils.js';
import { Column as PostgresColumn, Table as PostgresTable, sequelize } from './src/models/postgres/index.js';

console.log('=== TESTING OWNER CHECK ===');

async function testOwnerCheck() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2TDATA-P');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    const columnId = '49a7af36-b485-4083-8aea-3f6b7f4acb4c';
    const testUserId = '685146504543b4acb407d8c5'; // test@hcw.com.vn
    const managerUserId = '68d6be17362e0b14adfa4367'; // manager@test.com
    
    // Get column and table info
    console.log(`\n🔍 Getting column info: ${columnId}`);
    const column = await PostgresColumn.findByPk(columnId);
    if (!column) {
      console.log('❌ Column not found');
      return;
    }
    
    const table = await PostgresTable.findByPk(column.table_id);
    if (!table) {
      console.log('❌ Table not found');
      return;
    }
    
    const databaseId = table.database_id;
    const tableId = column.table_id;
    
    console.log('✅ Database ID:', databaseId);
    console.log('✅ Table ID:', tableId);
    
    // Check if test@hcw.com.vn is owner
    console.log(`\n🔍 Checking if test@hcw.com.vn is owner...`);
    const testIsOwner = await isOwner(testUserId, tableId, databaseId);
    console.log('✅ test@hcw.com.vn is owner:', testIsOwner);
    
    // Check if manager@test.com is owner
    console.log(`\n🔍 Checking if manager@test.com is owner...`);
    const managerIsOwner = await isOwner(managerUserId, tableId, databaseId);
    console.log('✅ manager@test.com is owner:', managerIsOwner);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
    process.exit(0);
  }
}

testOwnerCheck();
