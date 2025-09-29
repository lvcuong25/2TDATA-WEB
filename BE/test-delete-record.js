import axios from 'axios';

const BASE_URL = 'http://localhost:3004/api';

async function testDeleteRecord() {
  console.log('🧪 Testing Delete Record Functionality...\n');

  try {
    // First, create a test record
    console.log('🔄 Creating test record...');
    const createResponse = await axios.post(`${BASE_URL}/database/records`, {
      tableId: 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380',
      data: {
        'Name': 'Test Record for Deletion',
        'Email': 'test-delete@example.com'
      }
    });
    
    if (createResponse.status === 201) {
      console.log(`   ✅ Test record created`);
      console.log(`   Response data:`, JSON.stringify(createResponse.data, null, 2));
      const recordId = createResponse.data.data?._id || createResponse.data.data?.id || createResponse.data.id;
      console.log(`   Record ID: ${recordId}`);
      
      // Now try to delete the record
      console.log('🔄 Testing delete record...');
      const deleteResponse = await axios.delete(`${BASE_URL}/database/records/${recordId}`);
      
      if (deleteResponse.status === 200) {
        console.log(`   ✅ Record deleted successfully`);
        console.log(`   Status: ${deleteResponse.status}`);
        console.log(`   Message: ${deleteResponse.data.message}`);
      } else {
        console.log(`   ❌ Delete failed`);
        console.log(`   Status: ${deleteResponse.status}`);
        console.log(`   Message: ${deleteResponse.data?.message || 'Unknown error'}`);
      }
    } else {
      console.log(`   ❌ Failed to create test record`);
      console.log(`   Status: ${createResponse.status}`);
      console.log(`   Message: ${createResponse.data?.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ API Error: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`);
      if (error.response.data?.details) {
        console.log(`   Details: ${JSON.stringify(error.response.data.details)}`);
      }
    } else {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Delete record test finished.');
}

testDeleteRecord();
