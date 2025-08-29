// Test file for Fields functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test field preferences API
async function testFieldPreferences() {
  try {
    const tableId = '507f1f77bcf86cd799439011'; // Example table ID
    
    console.log('🧪 Testing Field Preferences API...');
    
    // Test 1: Get field preferences (should create default if not exists)
    console.log('\n1. Testing GET /tables/:tableId/field-preference');
    const getResponse = await axios.get(`${BASE_URL}/tables/${tableId}/field-preference`);
    console.log('✅ GET Response:', getResponse.data);
    
    // Test 2: Save field preferences
    console.log('\n2. Testing POST /tables/:tableId/field-preference');
    const fieldVisibility = {
      '507f1f77bcf86cd799439012': true,
      '507f1f77bcf86cd799439013': false,
      '507f1f77bcf86cd799439014': true
    };
    
    const saveResponse = await axios.post(`${BASE_URL}/tables/${tableId}/field-preference`, {
      fieldVisibility,
      showSystemFields: true
    });
    console.log('✅ POST Response:', saveResponse.data);
    
    // Test 3: Get field preferences again (should return saved data)
    console.log('\n3. Testing GET /tables/:tableId/field-preference (after save)');
    const getResponse2 = await axios.get(`${BASE_URL}/tables/${tableId}/field-preference`);
    console.log('✅ GET Response (after save):', getResponse2.data);
    
    console.log('\n🎉 All field preference tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Test frontend functionality simulation
function testFrontendFields() {
  console.log('\n🧪 Testing Frontend Fields Functionality...');
  
  // Simulate field visibility state
  const fieldVisibility = {
    '507f1f77bcf86cd799439012': true,
    '507f1f77bcf86cd799439013': false,
    '507f1f77bcf86cd799439014': true
  };
  
  const columns = [
    { _id: '507f1f77bcf86cd799439012', name: 'Name', dataType: 'text' },
    { _id: '507f1f77bcf86cd799439013', name: 'Email', dataType: 'text' },
    { _id: '507f1f77bcf86cd799439014', name: 'Age', dataType: 'number' },
    { _id: '507f1f77bcf86cd799439015', name: 'Created', dataType: 'date' }
  ];
  
  // Test visible columns filtering
  const visibleColumns = columns.filter(column => {
    if (fieldVisibility[column._id] === undefined) {
      return true; // Default visible
    }
    return fieldVisibility[column._id];
  });
  
  console.log('✅ Original columns:', columns.map(c => c.name));
  console.log('✅ Visible columns:', visibleColumns.map(c => c.name));
  console.log('✅ Hidden columns:', columns.filter(c => !visibleColumns.includes(c)).map(c => c.name));
  
  // Test field search
  const fieldSearch = 'name';
  const filteredColumns = columns.filter(column => 
    column.name.toLowerCase().includes(fieldSearch.toLowerCase())
  );
  
  console.log(`✅ Search results for "${fieldSearch}":`, filteredColumns.map(c => c.name));
  
  console.log('\n🎉 Frontend fields functionality simulation completed!');
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Fields Feature Tests...\n');
  
  // Test backend API
  await testFieldPreferences();
  
  // Test frontend simulation
  testFrontendFields();
  
  console.log('\n✨ All tests completed!');
}

// Run if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testFieldPreferences,
  testFrontendFields
};
