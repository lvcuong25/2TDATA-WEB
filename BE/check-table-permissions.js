/**
 * Check table permissions directly from database
 */

import mongoose from 'mongoose';
import TablePermission from './src/model/TablePermission.js';
import { Table as PostgresTable } from './src/models/postgres/index.js';

const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';

console.log('🔍 Checking Table Permissions Directly...');

async function checkPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/2TDATA-P');
    console.log('✅ MongoDB connected to 2TDATA-P');
    
    // Connect to PostgreSQL
    const { sequelize } = await import('./src/models/postgres/index.js');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    console.log('\n📝 STEP 1: Check PostgreSQL table...');
    const postgresTable = await PostgresTable.findByPk(tableId);
    if (postgresTable) {
      console.log('✅ PostgreSQL table found:');
      console.log('  ID:', postgresTable.id);
      console.log('  Name:', postgresTable.name);
      console.log('  Database ID:', postgresTable.database_id);
    } else {
      console.log('❌ PostgreSQL table not found');
      return;
    }
    
    console.log('\n📝 STEP 2: Check all TablePermissions in MongoDB...');
    const allPermissions = await TablePermission.find({}).limit(20);
    console.log('📊 Total permissions in database:', allPermissions.length);
    
    if (allPermissions.length > 0) {
      console.log('\n📋 All permissions:');
      allPermissions.forEach((perm, index) => {
        console.log(`  Permission ${index + 1}:`);
        console.log('    ID:', perm._id);
        console.log('    Name:', perm.name);
        console.log('    Table ID:', perm.tableId);
        console.log('    Database ID:', perm.databaseId);
        console.log('    Target Type:', perm.targetType);
        console.log('    Created At:', perm.createdAt);
        console.log('');
      });
    }
    
    console.log('\n📝 STEP 3: Search permissions by tableId...');
    const tablePermissions = await TablePermission.find({ tableId: tableId });
    console.log('📊 Permissions found for tableId:', tablePermissions.length);
    
    if (tablePermissions.length > 0) {
      tablePermissions.forEach((perm, index) => {
        console.log(`  Table Permission ${index + 1}:`);
        console.log('    ID:', perm._id);
        console.log('    Name:', perm.name);
        console.log('    Table ID:', perm.tableId);
        console.log('    Database ID:', perm.databaseId);
        console.log('    Target Type:', perm.targetType);
        console.log('    Permissions:', perm.permissions);
        console.log('    View Permissions:', perm.viewPermissions);
        console.log('');
      });
    }
    
    console.log('\n📝 STEP 4: Search permissions by databaseId...');
    const databasePermissions = await TablePermission.find({ databaseId: postgresTable.database_id });
    console.log('📊 Permissions found for databaseId:', databasePermissions.length);
    
    if (databasePermissions.length > 0) {
      databasePermissions.forEach((perm, index) => {
        console.log(`  Database Permission ${index + 1}:`);
        console.log('    ID:', perm._id);
        console.log('    Name:', perm.name);
        console.log('    Table ID:', perm.tableId);
        console.log('    Database ID:', perm.databaseId);
        console.log('    Target Type:', perm.targetType);
        console.log('');
      });
    }
    
    console.log('\n📝 STEP 5: Check if any permissions exist for this table in any format...');
    const allTablePermissions = await TablePermission.find({
      $or: [
        { tableId: tableId },
        { databaseId: postgresTable.database_id }
      ]
    });
    console.log('📊 All related permissions:', allTablePermissions.length);
    
    if (allTablePermissions.length > 0) {
      allTablePermissions.forEach((perm, index) => {
        console.log(`  Related Permission ${index + 1}:`);
        console.log('    ID:', perm._id);
        console.log('    Name:', perm.name);
        console.log('    Table ID:', perm.tableId, '(type:', typeof perm.tableId, ')');
        console.log('    Database ID:', perm.databaseId);
        console.log('    Target Type:', perm.targetType);
        console.log('    Permissions:', perm.permissions);
        console.log('    View Permissions:', perm.viewPermissions);
        console.log('');
      });
    } else {
      console.log('❌ No permissions found for this table');
      console.log('💡 This explains why frontend shows empty permissions');
    }
    
    await mongoose.connection.close();
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkPermissions();


