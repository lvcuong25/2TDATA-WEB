import mongoose from 'mongoose';
import { getViewableColumns } from './src/utils/columnPermissionUtils.js';

const MONGODB_URI = 'mongodb://localhost:27017/2TDATA-P';

async function testGetViewableColumns() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const userId = '685146504543b4acb407d8c5'; // test@hcw.com.vn
    const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
    const databaseId = '68de834d188faaa09c80b006';

    console.log('Testing getViewableColumns...');
    console.log('Parameters:', { userId, tableId, databaseId });

    const viewableColumns = await getViewableColumns(userId, tableId, databaseId);
    
    console.log('Result:', viewableColumns);
    console.log('Type:', typeof viewableColumns);
    console.log('Length:', Array.isArray(viewableColumns) ? viewableColumns.length : 'Not an array');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testGetViewableColumns();
