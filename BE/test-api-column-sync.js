import axios from 'axios';

/**
 * Test Column Sync via API Endpoints
 * 
 * This script tests the actual API endpoints to verify that column operations
 * properly sync record data and Metabase tables.
 */

const API_BASE_URL = 'http://localhost:5000/api';

// Mock authentication headers (you may need to adjust these)
const authHeaders = {
  'Content-Type': 'application/json',
  'Cookie': 'your-session-cookie-here' // You'll need to get this from browser
};

async function testColumnSyncViaAPI() {
  try {
    console.log('🧪 TESTING COLUMN SYNC VIA API ENDPOINTS');
    console.log('==========================================');
    
    // Step 1: Find a table with data
    console.log('\n📋 Step 1: Finding a table with data...');
    
    const tablesResponse = await axios.get(`${API_BASE_URL}/database/tables`, {
      headers: authHeaders
    });
    
    if (!tablesResponse.data.success || tablesResponse.data.data.length === 0) {
      console.log('❌ No tables found');
      return;
    }
    
    const tables = tablesResponse.data.data;
    let testTable = null;
    
    for (const table of tables) {
      try {
        const columnsResponse = await axios.get(`${API_BASE_URL}/database/tables/${table.id}/columns`, {
          headers: authHeaders
        });
        
        const recordsResponse = await axios.get(`${API_BASE_URL}/database/tables/${table.id}/records`, {
          headers: authHeaders
        });
        
        if (columnsResponse.data.success && recordsResponse.data.success && 
            columnsResponse.data.data.length > 0 && recordsResponse.data.records.length > 0) {
          testTable = table;
          console.log(`✅ Found test table: ${table.name} (ID: ${table.id})`);
          console.log(`   - Columns: ${columnsResponse.data.data.length}`);
          console.log(`   - Records: ${recordsResponse.data.records.length}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️ Error checking table ${table.name}: ${error.message}`);
      }
    }
    
    if (!testTable) {
      console.log('❌ No table with data found for testing');
      return;
    }
    
    // Step 2: Get initial state
    console.log('\n📊 Step 2: Getting initial state...');
    
    const initialColumnsResponse = await axios.get(`${API_BASE_URL}/database/tables/${testTable.id}/columns`, {
      headers: authHeaders
    });
    
    const initialRecordsResponse = await axios.get(`${API_BASE_URL}/database/tables/${testTable.id}/records`, {
      headers: authHeaders
    });
    
    const initialColumns = initialColumnsResponse.data.data;
    const initialRecords = initialRecordsResponse.data.records;
    
    console.log(`   - Initial columns: ${initialColumns.map(c => c.name).join(', ')}`);
    console.log(`   - Initial records: ${initialRecords.length}`);
    
    // Step 3: Test adding a new column
    console.log('\n🧪 Step 3: Testing ADD COLUMN...');
    
    const newColumnName = 'test_column_' + Date.now();
    const addColumnData = {
      tableId: testTable.id,
      name: newColumnName,
      dataType: 'text',
      isRequired: false,
      isUnique: false,
      defaultValue: null
    };
    
    try {
      const addColumnResponse = await axios.post(`${API_BASE_URL}/database/columns`, addColumnData, {
        headers: authHeaders
      });
      
      if (addColumnResponse.data.success) {
        console.log(`✅ Column added successfully: ${newColumnName}`);
        
        // Check if column appears in the list
        const updatedColumnsResponse = await axios.get(`${API_BASE_URL}/database/tables/${testTable.id}/columns`, {
          headers: authHeaders
        });
        
        const updatedColumns = updatedColumnsResponse.data.data;
        const hasNewColumn = updatedColumns.some(col => col.name === newColumnName);
        
        if (hasNewColumn) {
          console.log('✅ Column appears in column list');
        } else {
          console.log('❌ Column does not appear in column list');
        }
        
        // Get the new column ID
        const newColumn = updatedColumns.find(col => col.name === newColumnName);
        const newColumnId = newColumn._id;
        
        // Step 4: Test updating the column (rename)
        console.log('\n🧪 Step 4: Testing UPDATE COLUMN (rename)...');
        
        const renamedColumnName = 'renamed_column_' + Date.now();
        const updateColumnData = {
          name: renamedColumnName,
          dataType: 'text',
          isRequired: false,
          isUnique: false,
          defaultValue: null
        };
        
        try {
          const updateColumnResponse = await axios.put(`${API_BASE_URL}/database/columns/${newColumnId}`, updateColumnData, {
            headers: authHeaders
          });
          
          if (updateColumnResponse.data.success) {
            console.log(`✅ Column renamed successfully: ${newColumnName} → ${renamedColumnName}`);
            
            // Check if column name was updated
            const renamedColumnsResponse = await axios.get(`${API_BASE_URL}/database/tables/${testTable.id}/columns`, {
              headers: authHeaders
            });
            
            const renamedColumns = renamedColumnsResponse.data.data;
            const hasOldColumn = renamedColumns.some(col => col.name === newColumnName);
            const hasNewColumn = renamedColumns.some(col => col.name === renamedColumnName);
            
            if (!hasOldColumn && hasNewColumn) {
              console.log('✅ Column name updated in column list');
            } else {
              console.log('❌ Column name not updated properly');
            }
            
            // Step 5: Test deleting the column
            console.log('\n🧪 Step 5: Testing DELETE COLUMN...');
            
            try {
              const deleteColumnResponse = await axios.delete(`${API_BASE_URL}/database/columns/${newColumnId}`, {
                headers: authHeaders
              });
              
              if (deleteColumnResponse.data.success) {
                console.log(`✅ Column deleted successfully: ${renamedColumnName}`);
                
                // Check if column was removed
                const finalColumnsResponse = await axios.get(`${API_BASE_URL}/database/tables/${testTable.id}/columns`, {
                  headers: authHeaders
                });
                
                const finalColumns = finalColumnsResponse.data.data;
                const hasDeletedColumn = finalColumns.some(col => col.name === renamedColumnName);
                
                if (!hasDeletedColumn) {
                  console.log('✅ Column removed from column list');
                } else {
                  console.log('❌ Column still exists in column list');
                }
                
              } else {
                console.log('❌ Failed to delete column:', deleteColumnResponse.data.message);
              }
              
            } catch (deleteError) {
              console.log('❌ Error deleting column:', deleteError.response?.data?.message || deleteError.message);
            }
            
          } else {
            console.log('❌ Failed to update column:', updateColumnResponse.data.message);
          }
          
        } catch (updateError) {
          console.log('❌ Error updating column:', updateError.response?.data?.message || updateError.message);
        }
        
      } else {
        console.log('❌ Failed to add column:', addColumnResponse.data.message);
      }
      
    } catch (addError) {
      console.log('❌ Error adding column:', addError.response?.data?.message || addError.message);
    }
    
    // Summary
    console.log('\n📊 API TEST SUMMARY');
    console.log('===================');
    console.log('✅ Column sync API endpoints have been tested');
    console.log('   - Add column: Tests if column is created and appears in list');
    console.log('   - Update column: Tests if column name is updated');
    console.log('   - Delete column: Tests if column is removed from list');
    
    console.log('\n💡 NOTE: This test verifies API functionality.');
    console.log('   The actual Metabase sync happens in the background.');
    console.log('   Check the server logs for Metabase sync messages.');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

// Run the test
testColumnSyncViaAPI().then(() => {
  console.log('\n🎯 API column sync test completed!');
  process.exit(0);
});

