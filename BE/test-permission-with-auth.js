/**
 * Test permission API with manager@test.com authentication
 */

import mongoose from 'mongoose';
import axios from 'axios';
import User from './src/model/User.js';
import jwt from 'jsonwebtoken';

const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
const permissionId = '68de8a540fd25bda86266da7';

console.log('🔍 Testing Permission API with manager@test.com...');

async function connectDatabases() {
  try {
    await mongoose.connect('mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
    
    const { sequelize } = await import('./src/models/postgres/index.js');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    return { sequelize };
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

async function testPermissionAPI() {
  try {
    const { sequelize } = await connectDatabases();
    
    console.log('\n📝 STEP 1: Find manager@test.com user...');
    const user = await User.findOne({ email: 'manager@test.com' });
    if (!user) {
      console.log('❌ User manager@test.com not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log('  ID:', user._id);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Active:', user.active);
    
    console.log('\n📝 STEP 2: Generate JWT token...');
    const token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET || process.env.SECRET_KEY || 'your-secret-key',
      { expiresIn: '1h' }
    );
    console.log('✅ JWT token generated');
    
    console.log('\n📝 STEP 3: Test GET permissions API...');
    try {
      const response = await axios.get(`http://localhost:3004/api/permissions/tables/${tableId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      });
      
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      if (response.status === 200) {
        const permissions = response.data.data || [];
        console.log('\n📊 Permissions found:', permissions.length);
        permissions.forEach((perm, index) => {
          console.log(`  Permission ${index + 1}:`);
          console.log('    ID:', perm._id);
          console.log('    Name:', perm.name);
          console.log('    Target Type:', perm.targetType);
          console.log('    Table ID:', perm.tableId);
          console.log('');
        });
      } else if (response.status === 401) {
        console.log('❌ Authentication failed');
      } else if (response.status === 403) {
        console.log('❌ Forbidden - user not member of database');
      } else if (response.status === 404) {
        console.log('❌ Table not found');
      }
    } catch (error) {
      console.log('❌ API call failed:', error.message);
    }
    
    console.log('\n📝 STEP 4: Test PUT permission API...');
    try {
      const updateData = { 
        permissions: { 
          canView: true,
          canEditStructure: true,
          canEditData: true,
          canAddData: true
        }
      };
      
      const response = await axios.put(`http://localhost:3004/api/permissions/${permissionId}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      });
      
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      if (response.status === 200) {
        console.log('✅ Permission updated successfully');
      } else if (response.status === 404) {
        console.log('❌ Permission not found - this is the issue!');
        console.log('💡 The permission ID', permissionId, 'does not exist in database');
      } else if (response.status === 401) {
        console.log('❌ Authentication failed');
      } else if (response.status === 403) {
        console.log('❌ Forbidden - user lacks permission');
      }
    } catch (error) {
      console.log('❌ API call failed:', error.message);
    }
    
    console.log('\n📝 STEP 5: Check if user is member of database...');
    try {
      const { BaseMember } = await import('./src/model/BaseMember.js');
      const postgresModels = await import('./src/models/postgres/index.js');
      const PostgresTable = postgresModels.Table;
      
      const postgresTable = await PostgresTable.findByPk(tableId);
      if (postgresTable) {
        console.log('✅ PostgreSQL table found:');
        console.log('  Database ID:', postgresTable.database_id);
        
        const member = await BaseMember.findOne({
          databaseId: postgresTable.database_id,
          userId: user._id
        });
        
        if (member) {
          console.log('✅ User is member of database:');
          console.log('  Role:', member.role);
          console.log('  Database ID:', member.databaseId);
          console.log('  User ID:', member.userId);
        } else {
          console.log('❌ User is NOT member of database');
          console.log('💡 This explains why permission API returns 403');
        }
      }
    } catch (error) {
      console.log('❌ Error checking membership:', error.message);
    }
    
    await mongoose.connection.close();
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPermissionAPI();
