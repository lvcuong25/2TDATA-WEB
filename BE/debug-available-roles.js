import mongoose from 'mongoose';
import { Column as PostgresColumn, Table as PostgresTable, sequelize } from './src/models/postgres/index.js';
import ColumnPermission from './src/model/ColumnPermission.js';
import BaseMember from './src/model/BaseMember.js';
import User from './src/model/User.js';

console.log('=== DEBUGGING AVAILABLE ROLES LOGIC ===');

async function debugAvailableRoles() {
  try {
    // Connect to databases
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    const columnId = 'c75659e5-7bab-4e3c-bdb6-d3eb7ad8b7cf';
    const currentUserId = '68d6be17362e0b14adfa4367'; // manager@test.com
    
    console.log(`\n🔍 Debugging Column ID: ${columnId}`);
    console.log(`🔍 Current User ID: ${currentUserId}`);
    
    // Step 1: Get column and table info
    console.log('\n📋 Step 1: Getting column and table info...');
    const column = await PostgresColumn.findByPk(columnId);
    if (!column) {
      console.log('❌ Column not found');
      return;
    }
    console.log(`✅ Column: ${column.name}`);
    
    const table = await PostgresTable.findByPk(column.table_id);
    if (!table) {
      console.log('❌ Table not found');
      return;
    }
    console.log(`✅ Table: ${table.name}`);
    console.log(`✅ Database ID: ${table.database_id}`);
    
    const databaseId = table.database_id;
    
    // Step 2: Convert databaseId to ObjectId
    console.log('\n📋 Step 2: Converting databaseId to ObjectId...');
    const databaseObjectId = new mongoose.Types.ObjectId(databaseId);
    console.log(`✅ Converted databaseId: ${databaseObjectId}`);
    
    // Step 3: Check current user role
    console.log('\n📋 Step 3: Checking current user role...');
    const { getUserDatabaseRole } = await import('./src/utils/permissionUtils.js');
    const currentUserRoleData = await getUserDatabaseRole(currentUserId, databaseId);
    const currentUserRole = currentUserRoleData?.name || currentUserRoleData?.role || null;
    console.log(`✅ Current user role data:`, currentUserRoleData);
    console.log(`✅ Current user role: ${currentUserRole}`);
    
    // Step 4: Get existing permissions
    console.log('\n📋 Step 4: Getting existing permissions...');
    const existingPermissions = await ColumnPermission.find({
      columnId: columnId
    }).lean();
    console.log(`✅ Found ${existingPermissions.length} existing permissions`);
    
    existingPermissions.forEach((perm, index) => {
      console.log(`   Permission ${index + 1}:`, {
        id: perm._id,
        targetType: perm.targetType,
        name: perm.name,
        role: perm.role,
        userId: perm.userId,
        canView: perm.canView,
        canEdit: perm.canEdit
      });
    });
    
    // Step 5: Check all_members permission
    console.log('\n📋 Step 5: Checking all_members permission...');
    const hasAllMembersPermission = existingPermissions.some(perm => 
      perm.targetType === 'all_members'
    );
    console.log(`✅ Has all_members permission: ${hasAllMembersPermission}`);
    
    // Step 6: Check available roles logic
    console.log('\n📋 Step 6: Checking available roles logic...');
    const availableRoles = ['member']; // Default roles
    const availableRolesList = [];
    
    console.log(`✅ Available roles to check: ${availableRoles.join(', ')}`);
    console.log(`✅ Current user role: ${currentUserRole}`);
    console.log(`✅ Has all_members permission: ${hasAllMembersPermission}`);
    
    // all_members permission luôn tồn tại (mặc định), cho phép tạo specific_role để override
    console.log('✅ all_members permission luôn tồn tại (mặc định), checking specific roles...');
    
    for (const role of availableRoles) {
      console.log(`\n   🔍 Checking role: ${role}`);
      
      // Manager cannot create permissions for owner and manager role
      if (currentUserRole === 'manager' && (role === 'owner' || role === 'manager')) {
        console.log(`   ❌ Manager cannot create permissions for ${role} role`);
        continue;
      }
      
      // Check if role already has specific_role permission
      const hasRolePermission = existingPermissions.some(perm => 
        perm.targetType === 'specific_role' && perm.role === role
      );
      
      console.log(`   🔍 Role ${role} already has specific_role permission: ${hasRolePermission}`);
      
      if (!hasRolePermission) {
        console.log(`   ✅ Role ${role} can be added to available roles (will override all_members)`);
        availableRolesList.push({
          role: role,
          displayName: role.charAt(0).toUpperCase() + role.slice(1)
        });
      } else {
        console.log(`   ❌ Role ${role} already has specific_role permission, skipping`);
      }
    }
    
    console.log(`\n✅ Final available roles: ${availableRolesList.length}`);
    availableRolesList.forEach((role, index) => {
      console.log(`   ${index + 1}. ${role.role} (${role.displayName})`);
    });
    
    // Step 7: Check specific_role permissions in detail
    console.log('\n📋 Step 7: Checking specific_role permissions in detail...');
    const specificRolePermissions = existingPermissions.filter(perm => 
      perm.targetType === 'specific_role'
    );
    
    console.log(`✅ Found ${specificRolePermissions.length} specific_role permissions`);
    specificRolePermissions.forEach((perm, index) => {
      console.log(`   ${index + 1}. Role: ${perm.role}, Name: ${perm.name}`);
    });
    
    // Step 8: Check member role specifically
    console.log('\n📋 Step 8: Checking member role specifically...');
    const memberPermissions = existingPermissions.filter(perm => 
      perm.targetType === 'specific_role' && perm.role === 'member'
    );
    
    console.log(`✅ Found ${memberPermissions.length} member role permissions`);
    memberPermissions.forEach((perm, index) => {
      console.log(`   ${index + 1}. Permission ID: ${perm._id}, Name: ${perm.name}`);
    });
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('❌ Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
    process.exit(0);
  }
}

debugAvailableRoles();
