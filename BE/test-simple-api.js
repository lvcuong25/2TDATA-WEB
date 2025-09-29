import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

console.log('🧪 Testing simple API calls...\n');

async function testServerHealth() {
  try {
    console.log('🔄 Testing server health...');
    
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('   ✅ Server is healthy');
    console.log(`   Response:`, response.data);
    return true;
  } catch (error) {
    console.log('   ❌ Server health check failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCreateRecord() {
  try {
    console.log('\n🔄 Testing create record API...');
    
    const testRecord = {
      tableId: 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380',
      data: {
        'Tên': 'API Test User',
        'Tuổi': '30',
        'Ngày sinh': '1994-01-01',
        'Địa chỉ': 'API Test Address'
      }
    };
    
    console.log(`   Record data:`, testRecord);
    
    const response = await axios.post(
      `${API_BASE_URL}/database/records`,
      testRecord,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '68341e4d3f86f9c7ae46e962',
          'x-site-id': '686d45a89a0a0c37366567c8'
        }
      }
    );
    
    console.log('   ✅ Create record API successful');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    return response.data;
  } catch (error) {
    console.log('   ❌ Create record API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    console.log(`   Full error:`, error.response?.data);
    return null;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting simple API tests...\n');
    
    // Test 1: Server health
    const isHealthy = await testServerHealth();
    
    if (!isHealthy) {
      console.log('\n❌ Server is not healthy, skipping other tests');
      return;
    }
    
    // Test 2: Create record
    const createdRecord = await testCreateRecord();
    
    if (createdRecord) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log('\n❌ Some tests failed');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests
runTests();