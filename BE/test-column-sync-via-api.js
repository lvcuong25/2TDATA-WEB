/**
 * Test column sync via API endpoints (not direct database manipulation)
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3004/api/database';
const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';

console.log('🔍 Testing Column Sync via API Endpoints...');

// Test 1: Create a test column
async function createTestColumn() {
  console.log('\n📝 TEST 1: Create test column...');
  
  try {
    const columnData = {
      tableId: tableId,
      name: `Test_Sync_Column_${Date.now()}`,
      dataType: 'text',
      isRequired: false,
      isUnique: false,
      order: 999
    };
    
    console.log('   ➕ Creating column:', columnData.name);
    
    const response = await axios.post(`${BASE_URL}/columns`, columnData, {
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true
    });
    
    console.log('   Response Status:', response.status);
    if (response.status === 200) {
      console.log('   ✅ Column created successfully');
      return response.data.data._id;
    } else {
      console.log('   ❌ Column creation failed:', response.data.message);
      return null;
    }
    
  } catch (error) {
    console.log('   ❌ Error creating column:', error.message);
    return null;
  }
}

// Test 2: Rename the column
async function renameColumn(columnId) {
  console.log('\n📝 TEST 2: Rename column...');
  
  if (!columnId) {
    console.log('   ⚠️ No column ID to rename');
    return null;
  }
  
  try {
    const newName = `Renamed_Sync_Column_${Date.now()}`;
    
    console.log('   🔄 Renaming column to:', newName);
    
    const response = await axios.put(`${BASE_URL}/columns/${columnId}`, {
      name: newName
    }, {
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true
    });
    
    console.log('   Response Status:', response.status);
    if (response.status === 200) {
      console.log('   ✅ Column renamed successfully');
      return newName;
    } else {
      console.log('   ❌ Column rename failed:', response.data.message);
      return null;
    }
    
  } catch (error) {
    console.log('   ❌ Error renaming column:', error.message);
    return null;
  }
}

// Test 3: Change column data type
async function changeColumnDataType(columnId) {
  console.log('\n📝 TEST 3: Change column data type...');
  
  if (!columnId) {
    console.log('   ⚠️ No column ID to modify');
    return null;
  }
  
  try {
    console.log('   🔄 Changing column data type to: number');
    
    const response = await axios.put(`${BASE_URL}/columns/${columnId}`, {
      dataType: 'number'
    }, {
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true
    });
    
    console.log('   Response Status:', response.status);
    if (response.status === 200) {
      console.log('   ✅ Column data type changed successfully');
      return true;
    } else {
      console.log('   ❌ Column data type change failed:', response.data.message);
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Error changing column data type:', error.message);
    return false;
  }
}

// Test 4: Delete the column
async function deleteColumn(columnId) {
  console.log('\n📝 TEST 4: Delete column...');
  
  if (!columnId) {
    console.log('   ⚠️ No column ID to delete');
    return false;
  }
  
  try {
    console.log('   🗑️ Deleting column:', columnId);
    
    const response = await axios.delete(`${BASE_URL}/columns/${columnId}`, {
      validateStatus: () => true
    });
    
    console.log('   Response Status:', response.status);
    if (response.status === 200) {
      console.log('   ✅ Column deleted successfully');
      return true;
    } else {
      console.log('   ❌ Column deletion failed:', response.data.message);
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Error deleting column:', error.message);
    return false;
  }
}

// Test 5: Check records after operations
async function checkRecordsAfterOperations() {
  console.log('\n📝 TEST 5: Check records after operations...');
  
  try {
    const response = await axios.get(`${BASE_URL}/tables/${tableId}/records`, {
      validateStatus: () => true
    });
    
    console.log('   Response Status:', response.status);
    if (response.status === 200) {
      const records = response.data.data;
      console.log(`   📊 Found ${records.length} records`);
      
      // Check for any records with test column data
      let recordsWithTestData = 0;
      records.forEach(record => {
        const data = record.data || {};
        const hasTestData = Object.keys(data).some(key => 
          key.includes('Test_Sync_Column') || key.includes('Renamed_Sync_Column')
        );
        if (hasTestData) {
          recordsWithTestData++;
          console.log(`      ⚠️ Record ${record._id} has test column data:`, data);
        }
      });
      
      if (recordsWithTestData === 0) {
        console.log('   ✅ No records contain test column data - SYNCED');
      } else {
        console.log(`   ⚠️ ${recordsWithTestData} records still contain test column data - NOT SYNCED`);
      }
      
    } else {
      console.log('   ❌ Failed to fetch records:', response.data.message);
    }
    
  } catch (error) {
    console.log('   ❌ Error checking records:', error.message);
  }
}

// Main test function
async function testColumnSyncViaAPI() {
  try {
    console.log('🚀 Starting Column Sync API Tests...');
    
    // Create test column
    const columnId = await createTestColumn();
    
    if (columnId) {
      // Rename column
      await renameColumn(columnId);
      
      // Change data type
      await changeColumnDataType(columnId);
      
      // Check records after operations
      await checkRecordsAfterOperations();
      
      // Delete column
      await deleteColumn(columnId);
      
      // Final check
      await checkRecordsAfterOperations();
    }
    
    console.log('\n🎉 Column Sync API Tests Completed!');
    console.log('   📝 Check the results above to see if API endpoints sync records properly');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run the tests
testColumnSyncViaAPI();


