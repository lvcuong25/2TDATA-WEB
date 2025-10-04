/**
 * Test script to verify that permission checks are disabled
 * This script tests various operations that previously required permissions
 */

import axios from 'axios';
import mongoose from 'mongoose';
import { sequelize } from './src/models/postgres/index.js';

// Test configuration
const API_BASE_URL = 'http://localhost:3004/api';
const TEST_RECORD_ID = 'c9aaaa44-56ba-406d-87df-0eed472c912c'; // PostgreSQL record

console.log('🔍 Testing Permission Disabled System...');

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

// Test record update without permission headers
async function testRecordUpdateWithoutPermissions() {
  console.log('\n📝 TEST: Record update without permission headers...');
  
  try {
    const response = await axios.put(`${API_BASE_URL}/database/records/${TEST_RECORD_ID}`, {
      data: {
        'Test New Column': 'Permission Disabled Test',
        'Renamed Abc Column': 'Updated without permissions'
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header - should still work
      },
      timeout: 10000 // 10 second timeout
    });

    console.log('   ✅ Record update successful without permissions:', {
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

// Test column creation without permission headers
async function testColumnCreationWithoutPermissions() {
  console.log('\n📝 TEST: Column creation without permission headers...');
  
  try {
    // First get a table ID
    const tablesResponse = await axios.get(`${API_BASE_URL}/database/databases/test-database-id/tables`);
    const tables = tablesResponse.data.data || [];
    
    if (tables.length === 0) {
      console.log('   ⚠️ No tables found, skipping column creation test');
      return true;
    }
    
    const tableId = tables[0]._id;
    
    const response = await axios.post(`${API_BASE_URL}/database/columns`, {
      tableId: tableId,
      name: 'Permission Test Column',
      dataType: 'text',
      isRequired: false,
      order: 999
    }, {
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header - should still work
      }
    });

    console.log('   ✅ Column creation successful without permissions:', {
      status: response.status,
      success: response.data.success,
      columnId: response.data.data?._id
    });
    
    return true;
  } catch (error) {
    console.log('   ❌ Column creation failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return false;
  }
}

// Test record creation without permission headers
async function testRecordCreationWithoutPermissions() {
  console.log('\n📝 TEST: Record creation without permission headers...');
  
  try {
    // First get a table ID
    const tablesResponse = await axios.get(`${API_BASE_URL}/database/databases/test-database-id/tables`);
    const tables = tablesResponse.data.data || [];
    
    if (tables.length === 0) {
      console.log('   ⚠️ No tables found, skipping record creation test');
      return true;
    }
    
    const tableId = tables[0]._id;
    
    const response = await axios.post(`${API_BASE_URL}/database/records`, {
      tableId: tableId,
      data: {
        'Test New Column': 'Permission Disabled Record',
        'Renamed Abc Column': 'Created without permissions'
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header - should still work
      }
    });

    console.log('   ✅ Record creation successful without permissions:', {
      status: response.status,
      success: response.data.success,
      recordId: response.data.data?._id
    });
    
    return true;
  } catch (error) {
    console.log('   ❌ Record creation failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return false;
  }
}

// Test bulk operations without permission headers
async function testBulkOperationsWithoutPermissions() {
  console.log('\n📝 TEST: Bulk operations without permission headers...');
  
  try {
    // Test bulk delete (this should work without permissions now)
    const response = await axios.delete(`${API_BASE_URL}/database/records/bulk`, {
      data: {
        recordIds: [] // Empty array to avoid actually deleting anything
      },
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header - should still work
      }
    });

    console.log('   ✅ Bulk delete endpoint accessible without permissions:', {
      status: response.status
    });
    
    return true;
  } catch (error) {
    console.log('   ❌ Bulk operations failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
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
    results.push(await testRecordUpdateWithoutPermissions());
    results.push(await testColumnCreationWithoutPermissions());
    results.push(await testRecordCreationWithoutPermissions());
    results.push(await testBulkOperationsWithoutPermissions());
    
    // Summary
    const passedTests = results.filter(r => r).length;
    const totalTests = results.length;
    
    console.log('\n🎉 Permission Disabled Test Summary:');
    console.log(`   ✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`   ❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 All permission checks have been successfully disabled!');
      console.log('   📝 You can now test core functionality without permission restrictions.');
    } else {
      console.log('\n⚠️ Some permission checks may still be active.');
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
