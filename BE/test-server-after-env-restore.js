import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

console.log('🧪 Testing server after .env restore...\n');

async function testServerHealth() {
  try {
    console.log('🔄 Testing server health...');
    
    // Test basic API endpoint
    const response = await axios.get(`${API_BASE_URL}/database/tables`, {
      headers: {
        'x-user-id': '68341e4d3f86f9c7ae46e962',
        'x-site-id': '686d45a89a0a0c37366567c8'
      }
    });
    
    console.log('   ✅ Server is responding');
    console.log(`   Status: ${response.status}`);
    console.log(`   Tables count: ${response.data.data?.length || 0}`);
    return true;
  } catch (error) {
    console.log('   ❌ Server health check failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testFieldPreference() {
  try {
    console.log('\n🔄 Testing field preference API...');
    
    const testTableId = 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380';
    
    const response = await axios.get(
      `${API_BASE_URL}/database/tables/${testTableId}/field-preference`,
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

async function runTests() {
  try {
    console.log('🚀 Starting server tests after .env restore...\n');
    
    const results = {
      serverHealth: false,
      fieldPreference: false
    };
    
    // Test 1: Server health
    results.serverHealth = await testServerHealth();
    
    // Test 2: Field preference
    results.fieldPreference = await testFieldPreference();
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log(`   Server Health: ${results.serverHealth ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Field Preference: ${results.fieldPreference ? '✅ PASS' : '❌ FAIL'}`);
    
    const passedTests = Object.values(results).filter(result => result).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 Server is working perfectly after .env restore!');
      console.log('✅ File .env đã được phục hồi thành công!');
    } else {
      console.log('❌ Some tests failed.');
      console.log('📝 Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests
runTests();
