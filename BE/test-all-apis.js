import axios from 'axios';

console.log('🧪 Testing All PostgreSQL APIs...');
console.log('=================================');

async function testAllAPIs() {
  try {
    const baseUrl = 'http://localhost:3004/api/database';
    const testTableId = '68d792fbd5ea0d015b6b053f'; // Postgres table ID
    const testDatabaseId = '68d792d5d5ea0d015b6b0170';

    // Test 1: Get tables
    console.log('🔄 Testing getTables...');
    try {
      const response = await axios.get(`${baseUrl}/databases/${testDatabaseId}/tables`);
      console.log(`✅ getTables: Found ${response.data.data.length} tables`);
    } catch (error) {
      console.log('❌ getTables error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 2: Get table structure
    console.log('🔄 Testing getTableStructure...');
    try {
      const response = await axios.get(`${baseUrl}/tables/${testTableId}/structure`);
      console.log(`✅ getTableStructure: Found ${response.data.data.columns.length} columns`);
    } catch (error) {
      console.log('❌ getTableStructure error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 3: Get columns
    console.log('🔄 Testing getColumns...');
    try {
      const response = await axios.get(`${baseUrl}/tables/${testTableId}/columns`);
      console.log(`✅ getColumns: Found ${response.data.data.length} columns`);
    } catch (error) {
      console.log('❌ getColumns error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 4: Get records
    console.log('🔄 Testing getRecords...');
    try {
      const response = await axios.get(`${baseUrl}/tables/${testTableId}/records`);
      console.log(`✅ getRecords: Found ${response.data.data.length} records`);
    } catch (error) {
      console.log('❌ getRecords error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 5: Create a new column
    console.log('🔄 Testing createColumn...');
    try {
      const columnData = {
        tableId: testTableId,
        name: 'Test Column',
        dataType: 'text',
        isRequired: false,
        isUnique: false
      };
      const response = await axios.post(`${baseUrl}/columns`, columnData);
      console.log(`✅ createColumn: Created column ${response.data.data.name}`);
      
      // Test 6: Update the column
      console.log('🔄 Testing updateColumn...');
      const updateData = {
        name: 'Updated Test Column',
        dataType: 'text'
      };
      const updateResponse = await axios.put(`${baseUrl}/columns/${response.data.data._id}`, updateData);
      console.log(`✅ updateColumn: Updated column to ${updateResponse.data.data.name}`);
      
      // Test 7: Delete the column
      console.log('🔄 Testing deleteColumn...');
      await axios.delete(`${baseUrl}/columns/${response.data.data._id}`);
      console.log('✅ deleteColumn: Column deleted successfully');
      
    } catch (error) {
      console.log('❌ Column operations error:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 8: Create a new record
    console.log('🔄 Testing createRecord...');
    try {
      const recordData = {
        tableId: testTableId,
        data: {
          'tên': 'Test User',
          'tuổi': '25',
          'ngày sinh': '1998-01-01',
          'địa chỉ': 'Test Address'
        }
      };
      const response = await axios.post(`${baseUrl}/records`, recordData);
      console.log(`✅ createRecord: Created record ${response.data.data._id}`);
      
      // Test 9: Update the record
      console.log('🔄 Testing updateRecord...');
      const updateData = {
        data: {
          'tên': 'Updated Test User',
          'tuổi': '26',
          'ngày sinh': '1998-01-01',
          'địa chỉ': 'Updated Test Address'
        }
      };
      const updateResponse = await axios.put(`${baseUrl}/records/${response.data.data._id}`, updateData);
      console.log(`✅ updateRecord: Updated record ${updateResponse.data.data._id}`);
      
      // Test 10: Delete the record
      console.log('🔄 Testing deleteRecord...');
      await axios.delete(`${baseUrl}/records/${response.data.data._id}`);
      console.log('✅ deleteRecord: Record deleted successfully');
      
    } catch (error) {
      console.log('❌ Record operations error:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n🎉 All API tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAllAPIs().catch(console.error);

