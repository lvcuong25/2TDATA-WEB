import { createMetabaseTable } from './src/utils/metabaseTableCreator.js';

async function testMetabaseCreator() {
  try {
    console.log('🧪 Testing Metabase Table Creator...');
    
    // Create a test table object
    const testTable = {
      id: 'test-table-id-12345',
      name: 'Test Table',
      database_id: '68d792d5d5ea0d015b6b0170',
      user_id: '68341e4d3f86f9c7ae46e962',
      site_id: '686d45a89a0a0c37366567c8',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    console.log('📋 Test table:', testTable);
    
    const result = await createMetabaseTable(testTable, [], []);
    
    console.log('🎯 Result:', result);
    
  } catch (error) {
    console.error('❌ Error testing Metabase creator:', error);
  }
}

testMetabaseCreator();

