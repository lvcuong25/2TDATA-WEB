import mongoose from 'mongoose';
import ColumnPermission from './src/model/ColumnPermission.js';
import User from './src/model/User.js';
import { Column as PostgresColumn, Table as PostgresTable, sequelize } from './src/models/postgres/index.js';

console.log('=== CHECKING ALL PERMISSIONS FOR USER ===');

async function checkAllPermissionsForUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2TDATA-P');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    const columnId = '49a7af36-b485-4083-8aea-3f6b7f4acb4c';
    const testUserId = '685146504543b4acb407d8c5'; // test@hcw.com.vn
    
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
    
    // Get all permissions for this column
    console.log(`\n🔍 Getting all permissions for column ${columnId}...`);
    const allPermissions = await ColumnPermission.find({
      columnId: columnId
    }).populate('userId', 'name email').populate('createdBy', 'name email');
    
    console.log(`✅ Found ${allPermissions.length} permissions:`);
    allPermissions.forEach((perm, index) => {
      console.log(`\n  Permission ${index + 1}:`);
      console.log(`    - ID: ${perm._id}`);
      console.log(`    - Target Type: ${perm.targetType}`);
      console.log(`    - Name: ${perm.name}`);
      console.log(`    - Can View: ${perm.canView}`);
      console.log(`    - Can Edit: ${perm.canEdit}`);
      console.log(`    - Role: ${perm.role || 'N/A'}`);
      console.log(`    - User ID: ${perm.userId ? perm.userId.email : 'N/A'}`);
      console.log(`    - Created By: ${perm.createdBy ? perm.createdBy.email : 'N/A'}`);
    });
    
    // Check specific permissions for test@hcw.com.vn
    console.log(`\n🔍 Checking specific permissions for test@hcw.com.vn...`);
    const userPermissions = await ColumnPermission.find({
      columnId: columnId,
      $or: [
        { targetType: 'all_members' },
        { targetType: 'specific_user', userId: testUserId },
        { targetType: 'specific_role', role: 'manager' }
      ]
    }).populate('userId', 'name email').populate('createdBy', 'name email');
    
    console.log(`✅ Found ${userPermissions.length} relevant permissions for test@hcw.com.vn:`);
    userPermissions.forEach((perm, index) => {
      console.log(`\n  Relevant Permission ${index + 1}:`);
      console.log(`    - Target Type: ${perm.targetType}`);
      console.log(`    - Can View: ${perm.canView}`);
      console.log(`    - Can Edit: ${perm.canEdit}`);
      console.log(`    - Role: ${perm.role || 'N/A'}`);
      console.log(`    - User ID: ${perm.userId ? perm.userId.email : 'N/A'}`);
    });
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
    process.exit(0);
  }
}

checkAllPermissionsForUser();
