import mongoose from 'mongoose';
import ColumnPermission from './src/model/ColumnPermission.js';

const MONGODB_URI = 'mongodb://localhost:27017/2TDATA-P';

async function checkAllColumnPermissions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';

    console.log('Checking all column permissions for table...');
    const allPermissions = await ColumnPermission.find({ tableId: tableId });
    
    console.log(`Found ${allPermissions.length} total permissions for table ${tableId}:`);
    
    // Group by columnId
    const permissionsByColumn = {};
    allPermissions.forEach(perm => {
      if (!permissionsByColumn[perm.columnId]) {
        permissionsByColumn[perm.columnId] = [];
      }
      permissionsByColumn[perm.columnId].push(perm);
    });

    Object.keys(permissionsByColumn).forEach(columnId => {
      console.log(`\nColumn ${columnId}:`);
      permissionsByColumn[columnId].forEach(perm => {
        console.log(`  - ${perm.targetType}: canView=${perm.canView}, canEdit=${perm.canEdit}, userId=${perm.userId}, role=${perm.role}`);
      });
    });

    // Check which columns have no permissions
    const allColumnIds = [
      '49a7af36-b485-4083-8aea-3f6b7f4acb4c', // New Test Column
      '0948c5ef-2c83-4562-bdc9-e65f8d465841', // Test Column 3
      '22a0b020-e744-4b96-89bf-6be4888a4ad5', // TEst
      'c75659e5-7bab-4e3c-bdb6-d3eb7ad8b7cf'  // permission
    ];

    console.log('\nColumns with NO permissions:');
    allColumnIds.forEach(columnId => {
      if (!permissionsByColumn[columnId]) {
        console.log(`  - ${columnId}: NO PERMISSIONS`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllColumnPermissions();
