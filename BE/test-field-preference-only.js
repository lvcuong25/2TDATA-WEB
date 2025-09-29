import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

console.log('🧪 Testing field preference API only...\n');

// Test data
const testTableId = 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380'; // postgresX table
const testUserId = '68341e4d3f86f9c7ae46e962';
const testSiteId = '686d45a89a0a0c37366567c8';

async function testFieldPreference() {
  try {
    console.log('🔄 Testing field preference API...');
    console.log(`   Table ID: ${testTableId}`);
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Site ID: ${testSiteId}`);
    
    const response = await axios.get(
      `${API_BASE_URL}/database/tables/${testTableId}/field-preference`,
      {
        headers: {
          'x-user-id': testUserId,
          'x-site-id': testSiteId
        }
      }
    );
    
    console.log('   ✅ Field preference API successful');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    return true;
  } catch (error) {
    console.log('   ❌ Field preference API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    console.log(`   Full error:`, error.response?.data);
    return false;
  }
}

async function testSaveFieldPreference() {
  try {
    console.log('\n🔄 Testing save field preference API...');
    
    const preferenceData = {
      fieldVisibility: {
        'Tên': true,
        'Tuổi': true,
        'Ngày sinh': true,
        'Địa chỉ': false
      },
      showSystemFields: false
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/database/tables/${testTableId}/field-preference`,
      preferenceData,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
          'x-site-id': testSiteId
        }
      }
    );
    
    console.log('   ✅ Save field preference API successful');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    return true;
  } catch (error) {
    console.log('   ❌ Save field preference API failed:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    console.log(`   Full error:`, error.response?.data);
    return false;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting field preference tests...\n');
    
    // Test 1: Get field preference
    const getResult = await testFieldPreference();
    
    // Test 2: Save field preference
    const saveResult = await testSaveFieldPreference();
    
    // Test 3: Get field preference again
    const getResult2 = await testFieldPreference();
    
    console.log('\n📊 Test Results Summary:');
    console.log(`   Get Field Preference: ${getResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Save Field Preference: ${saveResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Get Field Preference (2nd): ${getResult2 ? '✅ PASS' : '❌ FAIL'}`);
    
    const passedTests = [getResult, saveResult, getResult2].filter(result => result).length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/3 tests passed`);
    
    if (passedTests === 3) {
      console.log('🎉 All field preference tests passed!');
    } else {
      console.log('❌ Some field preference tests failed.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests
runTests();
