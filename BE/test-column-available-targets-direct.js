import mongoose from 'mongoose';
import { Column as PostgresColumn, Table as PostgresTable, sequelize } from './src/models/postgres/index.js';
import ColumnPermission from './src/model/ColumnPermission.js';
import BaseMember from './src/model/BaseMember.js';
import User from './src/model/User.js';

console.log('=== TESTING COLUMN AVAILABLE TARGETS DIRECT ===');

async function testColumnAvailableTargetsDirect() {
  try {
    // Connect to databases
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    const columnId = 'c75659e5-7bab-4e3c-bdb6-d3eb7ad8b7cf';
    const currentUserId = '68d6be17362e0b14adfa4367'; // test@hcw.com.vn
    
    console.log(`\n🔍 Testing with Column ID: ${columnId}`);
    console.log(`🔍 Testing with User ID: ${currentUserId}`);
    
    // Simulate the API function logic
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
    
    const databaseId = table.database_id;
    
    // Convert databaseId to ObjectId
    console.log('\n📋 Step 2: Converting databaseId to ObjectId...');
    const databaseObjectId = new mongoose.Types.ObjectId(databaseId);
    console.log(`✅ Converted databaseId: ${databaseObjectId}`);
    
    // Check user role
    console.log('\n📋 Step 3: Checking user role...');
    const { getUserDatabaseRole } = await import('./src/utils/permissionUtils.js');
    const currentUserRole = await getUserDatabaseRole(currentUserId, databaseId);
    console.log(`✅ Current user role: ${currentUserRole}`);
    
    // Get database members
    console.log('\n📋 Step 4: Getting database members...');
    const members = await BaseMember.find({ databaseId: databaseObjectId })
      .populate('userId', 'name email')
      .lean();
    console.log(`✅ Found ${members.length} members`);
    
    // Get existing permissions
    console.log('\n📋 Step 5: Getting existing permissions...');
    const existingPermissions = await ColumnPermission.find({
      columnId: columnId
    }).lean();
    console.log(`✅ Found ${existingPermissions.length} existing permissions`);
    
    // Build available users
    console.log('\n📋 Step 6: Building available users...');
    const availableUsers = [];
    const availableRoles = ['member'];
    
    for (const member of members) {
      const userId = member.userId._id.toString();
      const userRole = member.role;
      const userName = member.userId.name;
      const userEmail = member.userId.email;
      
      // Check rules
      let canCreatePermission = true;
      let reason = '';
      
      // Manager cannot create permissions for Owner and Manager
      if (currentUserRole === 'manager') {
        if (userRole === 'owner' || userRole === 'manager') {
          canCreatePermission = false;
          reason = 'Managers cannot create permissions for owners or other managers';
        }
      }
      
      // Owner cannot create permissions for themselves
      if (currentUserRole === 'owner' && userId === currentUserId.toString()) {
        canCreatePermission = false;
        reason = 'Owners cannot create permissions for themselves';
      }
      
      // Check if user already has permission
      const hasPermission = existingPermissions.some(perm => 
        perm.targetType === 'specific_user' && 
        perm.userId && 
        perm.userId.toString() === userId
      );
      
      if (hasPermission) {
        canCreatePermission = false;
        reason = 'Permission already exists for this user';
      }
      
      if (canCreatePermission) {
        availableUsers.push({
          _id: userId,
          name: userName,
          email: userEmail,
          role: userRole
        });
      } else {
        console.log(`   ⚠️ Cannot create permission for ${userName}: ${reason}`);
      }
    }
    
    console.log(`✅ Available users: ${availableUsers.length}`);
    availableUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.role})`);
    });
    
    // Build available roles
    console.log('\n📋 Step 7: Building available roles...');
    const availableRolesList = [];
    
    // Check if all_members permission exists
    const hasAllMembersPermission = existingPermissions.some(perm => 
      perm.targetType === 'all_members'
    );
    
    // If all_members permission exists, cannot create specific_role permissions
    if (!hasAllMembersPermission) {
      for (const role of availableRoles) {
        // Manager cannot create permissions for owner and manager role
        if (currentUserRole === 'manager' && (role === 'owner' || role === 'manager')) {
          continue;
        }
        
        // Check if role already has permission
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
    
    console.log(`✅ Available roles: ${availableRolesList.length}`);
    availableRolesList.forEach((role, index) => {
      console.log(`   ${index + 1}. ${role.role} (${role.displayName})`);
    });
    
    // Final result
    const result = {
      success: true,
      data: {
        users: availableUsers,
        roles: availableRolesList,
        canCreateAllMembers: !hasAllMembersPermission && currentUserRole !== 'manager'
      }
    };
    
    console.log('\n✅ Final API Response:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('❌ Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
    process.exit(0);
  }
}

testColumnAvailableTargetsDirect();
