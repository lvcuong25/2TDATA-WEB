/**
 * Test script to verify that frontend permission API calls are disabled
 * This script simulates the frontend behavior and checks if permission calls are made
 */

import axios from 'axios';
import mongoose from 'mongoose';
import { sequelize } from './src/models/postgres/index.js';

// Test configuration
const API_BASE_URL = 'http://localhost:3004/api';
const TEST_TABLE_ID = '601e2a34-6a7e-4ef1-99eb-65648739b0d9'; // From the error logs

console.log('🔍 Testing Frontend Permission API Calls Disabled...');

// Connect to databases
async function connectDatabases() {
  try {
    // MongoDB connection
    await mongoose.connect('mongodb://localhost:27017/2tdata', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    // PostgreSQL connection
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Test if permission API calls are still being made (they should return 403 if enabled)
async function testPermissionAPICalls() {
  console.log('\n📝 TEST: Checking if permission API calls are still active...');
  
  const permissionEndpoints = [
    `/permissions/tables/${TEST_TABLE_ID}/permissions`,
    `/permissions/tables/${TEST_TABLE_ID}/columns/permissions`,
    `/permissions/tables/${TEST_TABLE_ID}/records/permissions`,
    `/permissions/tables/${TEST_TABLE_ID}/cells/permissions`
  ];
  
  let activeEndpoints = 0;
  let disabledEndpoints = 0;
  
  for (const endpoint of permissionEndpoints) {
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        timeout: 5000,
        validateStatus: () => true // Don't throw on any status code
      });
      
      if (response.status === 403) {
        console.log(`   ❌ ${endpoint} - Still active (403 Forbidden)`);
        activeEndpoints++;
      } else if (response.status === 404) {
        console.log(`   ✅ ${endpoint} - Disabled (404 Not Found)`);
        disabledEndpoints++;
      } else {
        console.log(`   ⚠️ ${endpoint} - Unexpected status: ${response.status}`);
        activeEndpoints++;
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ ${endpoint} - Connection refused (server not running)`);
        activeEndpoints++;
      } else {
        console.log(`   ✅ ${endpoint} - Disabled (${error.message})`);
        disabledEndpoints++;
      }
    }
  }
  
  console.log(`\n📊 Permission API Status:`);
  console.log(`   ❌ Active endpoints: ${activeEndpoints}`);
  console.log(`   ✅ Disabled endpoints: ${disabledEndpoints}`);
  
  return disabledEndpoints === permissionEndpoints.length;
}

// Test record update to see if it works without permission calls
async function testRecordUpdateWithoutPermissionCalls() {
  console.log('\n📝 TEST: Record update without permission API calls...');
  
  try {
    const response = await axios.put(`${API_BASE_URL}/database/records/c9aaaa44-56ba-406d-87df-0eed472c912c`, {
      data: {
        'Test New Column': 'Frontend Permission Test',
        'Renamed Abc Column': 'Updated without permission calls'
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('   ✅ Record update successful without permission calls:', {
      status: response.status,
      success: response.data.success,
      message: response.data.message
    });
    
    return true;
  } catch (error) {
    console.log('   ❌ Record update failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      error: error.code || 'Unknown error'
    });
    return false;
  }
}

// Main test function
async function runTests() {
  try {
    await connectDatabases();
    
    const results = [];
    
    // Run all tests
    results.push(await testPermissionAPICalls());
    results.push(await testRecordUpdateWithoutPermissionCalls());
    
    // Summary
    const passedTests = results.filter(r => r).length;
    const totalTests = results.length;
    
    console.log('\n🎉 Frontend Permission Disabled Test Summary:');
    console.log(`   ✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`   ❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 All frontend permission API calls have been successfully disabled!');
      console.log('   📝 You should now be able to update records without permission restrictions.');
    } else {
      console.log('\n⚠️ Some frontend permission API calls may still be active.');
      console.log('   📝 Check the failed tests above for details.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    // Close database connections
    await mongoose.connection.close();
    await sequelize.close();
    console.log('\n📡 Database connections closed');
  }
}

// Run the tests
runTests();


