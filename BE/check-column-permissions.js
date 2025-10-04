import mongoose from 'mongoose';
import ColumnPermission from './src/model/ColumnPermission.js';

const MONGODB_URI = 'mongodb://localhost:27017/2TDATA-P';

async function checkColumnPermissions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const columnId = '49a7af36-b485-4083-8aea-3f6b7f4acb4c'; // New Test Column
    const userId = '685146504543b4acb407d8c5'; // test@hcw.com.vn

    console.log('Checking column permissions...');
    const permissions = await ColumnPermission.find({ columnId: columnId });
    
    console.log(`Found ${permissions.length} permissions for column ${columnId}:`);
    permissions.forEach(perm => {
      console.log(`- ${perm.targetType}: canView=${perm.canView}, canEdit=${perm.canEdit}, userId=${perm.userId}, role=${perm.role}`);
    });

    console.log('\nChecking specific user permission...');
    const userPermission = permissions.find(perm => 
      perm.targetType === 'specific_user' && perm.userId.toString() === userId
    );

    if (userPermission) {
      console.log(`✅ User permission found: canView=${userPermission.canView}, canEdit=${userPermission.canEdit}`);
    } else {
      console.log('❌ No specific user permission found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkColumnPermissions();
