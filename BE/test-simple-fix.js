import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

console.log('🧪 Testing simple API calls...\n');

async function testFieldPreference() {
  try {
    console.log('🔄 Testing field preference API...');
    
    const response = await axios.get(
      `${API_BASE_URL}/database/tables/f7cb83e6-918a-4bd6-83ee-f4a2b2f94380/field-preference`,
      {
        headers: {
          'x-user-id': '68341e4d3f86f9c7ae46e962',
          'x-site-id': '686d45a89a0a0c37366567c8'
        }
      }
    );
    
    console.log('   ✅ Field preference API working');
    console.log(`   Status: ${response.status}`);
    return true;
  } catch (error) {
    console.log('   ❌ Field preference API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCreateRecord() {
  try {
    console.log('\n🔄 Testing create record...');
    
    const testRecord = {
      tableId: 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380',
      data: {
        'Tên': 'Fix Test User',
        'Tuổi': '25',
        'Ngày sinh': '1999-01-01',
        'Địa chỉ': 'Fix Test Address'
      }
    };
    
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
    console.log(`   Record ID: ${response.data.data._id}`);
    return true;
  } catch (error) {
    console.log('   ❌ Create record API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runTests() {
  try {
    const results = {
      fieldPreference: false,
      createRecord: false
    };
    
    results.fieldPreference = await testFieldPreference();
    results.createRecord = await testCreateRecord();
    
    console.log('\n📊 Test Results:');
    console.log(`   Field Preference: ${results.fieldPreference ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Create Record: ${results.createRecord ? '✅ PASS' : '❌ FAIL'}`);
    
    const passedTests = Object.values(results).filter(result => result).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Cast to ObjectId errors are fixed!');
    } else {
      console.log('❌ Some tests failed. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

runTests();
