import mongoose from 'mongoose';
import { Column as PostgresColumn, Table as PostgresTable, sequelize } from './src/models/postgres/index.js';
import ColumnPermission from './src/model/ColumnPermission.js';
import BaseMember from './src/model/BaseMember.js';
import User from './src/model/User.js';

console.log('=== TESTING COLUMN PERMISSION LOGIC ===');

async function testColumnPermissionLogic() {
  try {
    // Connect to databases
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    const columnId = 'c75659e5-7bab-4e3c-bdb6-d3eb7ad8b7cf';
    const databaseId = '68de834d188faaa09c80b006';
    
    console.log(`\n🔍 Testing with Column ID: ${columnId}`);
    console.log(`🔍 Testing with Database ID: ${databaseId}`);
    
    // 1. Get column and table info
    console.log('\n📋 Step 1: Getting column and table info...');
    const column = await PostgresColumn.findByPk(columnId);
    if (!column) {
      console.log('❌ Column not found');
      return;
    }
    console.log(`✅ Column found: ${column.name}`);
    
    const table = await PostgresTable.findByPk(column.table_id);
    if (!table) {
      console.log('❌ Table not found');
      return;
    }
    console.log(`✅ Table found: ${table.name}`);
    console.log(`✅ Table database_id: ${table.database_id}`);
    
    // 2. Convert databaseId to ObjectId
    console.log('\n📋 Step 2: Converting databaseId to ObjectId...');
    const databaseObjectId = new mongoose.Types.ObjectId(databaseId);
    console.log(`✅ Converted databaseId: ${databaseObjectId}`);
    
    // 3. Get database members
    console.log('\n📋 Step 3: Getting database members...');
    const members = await BaseMember.find({ databaseId: databaseObjectId })
      .populate('userId', 'name email')
      .lean();
    console.log(`✅ Found ${members.length} members`);
    members.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.userId?.name} (${member.role})`);
    });
    
    // 4. Get existing column permissions
    console.log('\n📋 Step 4: Getting existing column permissions...');
    const existingPermissions = await ColumnPermission.find({
      columnId: columnId
    }).lean();
    console.log(`✅ Found ${existingPermissions.length} existing permissions`);
    existingPermissions.forEach((perm, index) => {
      console.log(`   ${index + 1}. ${perm.targetType} - ${perm.name} (canView: ${perm.canView}, canEdit: ${perm.canEdit})`);
    });
    
    // 5. Test duplication check logic
    console.log('\n📋 Step 5: Testing duplication check logic...');
    
    // Test specific_user duplication
    const testUserId = '68d6be17362e0b14adfa4367'; // test@hcw.com.vn
    const hasUserPermission = existingPermissions.some(perm => 
      perm.targetType === 'specific_user' && 
      perm.userId && 
      perm.userId.toString() === testUserId
    );
    console.log(`✅ User ${testUserId} already has permission: ${hasUserPermission}`);
    
    // Test specific_role duplication
    const testRole = 'member';
    const hasRolePermission = existingPermissions.some(perm => 
      perm.targetType === 'specific_role' && perm.role === testRole
    );
    console.log(`✅ Role ${testRole} already has permission: ${hasRolePermission}`);
    
    // Test all_members duplication
    const hasAllMembersPermission = existingPermissions.some(perm => 
      perm.targetType === 'all_members'
    );
    console.log(`✅ All members permission exists: ${hasAllMembersPermission}`);
    
    // 6. Test available users logic
    console.log('\n📋 Step 6: Testing available users logic...');
    const availableUsers = [];
    
    for (const member of members) {
      const userId = member.userId._id.toString();
      const userRole = member.role;
      const userName = member.userId.name;
      const userEmail = member.userId.email;
      
      // Check if user already has permission
      const hasPermission = existingPermissions.some(perm => 
        perm.targetType === 'specific_user' && 
        perm.userId && 
        perm.userId.toString() === userId
      );
      
      if (!hasPermission) {
        availableUsers.push({
          _id: userId,
          name: userName,
          email: userEmail,
          role: userRole
        });
      }
    }
    
    console.log(`✅ Available users for new permissions: ${availableUsers.length}`);
    availableUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.role})`);
    });
    
    // 7. Test available roles logic
    console.log('\n📋 Step 7: Testing available roles logic...');
    const availableRoles = ['member'];
    const availableRolesList = [];
    
    if (!hasAllMembersPermission) {
      for (const role of availableRoles) {
        const hasRolePermission = existingPermissions.some(perm => 
          perm.targetType === 'specific_role' && perm.role === role
        );
        
        if (!hasRolePermission) {
          availableRolesList.push({
            role: role,
            displayName: role.charAt(0).toUpperCase() + role.slice(1)
          });
        }
      }
    }
    
    console.log(`✅ Available roles for new permissions: ${availableRolesList.length}`);
    availableRolesList.forEach((role, index) => {
      console.log(`   ${index + 1}. ${role.role} (${role.displayName})`);
    });
    
    console.log('\n✅ All logic tests completed successfully!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('❌ Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
    process.exit(0);
  }
}

testColumnPermissionLogic();
