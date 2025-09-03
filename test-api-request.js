import fetch from 'node-fetch';

const testMultiSelectAPI = async () => {
  try {
    console.log('🧪 Testing multi-select column creation via API...');
    
    // Note: This is a test request to check if the API accepts multi_select
    // In a real scenario, you'd need proper authentication and table ID
    const response = await fetch('http://localhost:3004/api/database/columns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // These would need to be real authentication headers in production
        'Authorization': 'Bearer test-token',
        'X-Site-Id': 'test-site-id'
      },
      body: JSON.stringify({
        tableId: '507f1f77bcf86cd799439011', // Test ObjectId
        name: 'test_multi_select_field',
        dataType: 'multi_select',
        multiSelectConfig: {
          options: ['Option A', 'Option B', 'Option C'],
          defaultValue: ['Option A']
        }
      })
    });
    
    const result = await response.text();
    console.log('📄 Response Status:', response.status);
    console.log('📄 Response:', result);
    
    if (response.status === 500 && result.includes('multi_select` is not a valid enum value')) {
      console.log('❌ Still getting enum validation error');
    } else if (response.status === 401 || response.status === 404) {
      console.log('✅ Schema accepts multi_select (got auth/not found error instead of validation error)');
    } else {
      console.log('ℹ️ Got different response - schema likely works');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testMultiSelectAPI();
