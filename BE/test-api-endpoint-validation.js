import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing API Endpoint Data Validation...');

async function testAPIEndpointValidation() {
  try {
    const baseURL = 'http://localhost:5000/api';
    const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
    
    console.log(`\n🔍 Testing with Table: ${tableId}`);
    
    // ===== TEST 1: VALID DATA =====
    console.log('\n📝 TEST 1: Creating record with valid data via API...');
    
    const validData = {
      'Abc': 'API Valid Test Record',
      'Test Column': 'API Valid Test Data',
      'Test Column 3': 789
    };
    
    try {
      const response = await axios.post(`${baseURL}/records`, {
        tableId: tableId,
        data: validData
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'authToken=your-auth-token' // You may need to adjust this
        }
      });
      
      console.log(`   ✅ Valid record created via API: ${response.data.record._id}`);
      console.log(`   📊 Data:`, validData);
    } catch (error) {
      console.log(`   ❌ Valid record creation failed: ${error.response?.data?.message || error.message}`);
    }
    
    // ===== TEST 2: INVALID DATA (NON-EXISTENT COLUMN) =====
    console.log('\n📝 TEST 2: Creating record with invalid data (non-existent column) via API...');
    
    const invalidData = {
      'Abc': 'API Invalid Test Record',
      'xyz': 'This column does not exist',
      'Test Column': 'API Valid Test Data'
    };
    
    try {
      const response = await axios.post(`${baseURL}/records`, {
        tableId: tableId,
        data: invalidData
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'authToken=your-auth-token' // You may need to adjust this
        }
      });
      
      console.log(`   ⚠️ Invalid record created via API (should not happen): ${response.data.record._id}`);
      console.log(`   📊 Data:`, invalidData);
    } catch (error) {
      console.log(`   ✅ Invalid record creation properly rejected: ${error.response?.data?.message || error.message}`);
    }
    
    // ===== TEST 3: INVALID DATA (WRONG DATA TYPE) =====
    console.log('\n📝 TEST 3: Creating record with invalid data (wrong data type) via API...');
    
    const wrongTypeData = {
      'Abc': 'API Wrong Type Test Record',
      'Test Column': 'API Valid Test Data',
      'Test Column 3': 'This should be a number' // This is a string, but column expects number
    };
    
    try {
      const response = await axios.post(`${baseURL}/records`, {
        tableId: tableId,
        data: wrongTypeData
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'authToken=your-auth-token' // You may need to adjust this
        }
      });
      
      console.log(`   ⚠️ Wrong type record created via API (should not happen): ${response.data.record._id}`);
      console.log(`   📊 Data:`, wrongTypeData);
    } catch (error) {
      console.log(`   ✅ Wrong type record creation properly rejected: ${error.response?.data?.message || error.message}`);
    }
    
    console.log('\n🎉 API endpoint validation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAPIEndpointValidation();



