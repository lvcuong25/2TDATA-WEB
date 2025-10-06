const axios = require('axios');

async function testRecordUpdate() {
  try {
    console.log('Testing record update with permission preservation...');
    
    // Login
    const loginRes = await axios.post('http://localhost:3004/api/auth/sign-in', {
      email: 'test@hcw.com.vn',
      password: 'Test123'
    });
    
    const token = loginRes.data.accessToken;
    console.log('Login successful');
    
    // Update record
    const updateRes = await axios.put('http://localhost:3004/api/database/records/e77ff2ac-64c9-4a05-a881-2b7e36fba63e', {
      data: {
        "TEst": "Updated by test user",
        "permission": "Updated by test user",
        "Test Column 3": "Updated by test user",
        "New Test Column1": "Should NOT be updated"
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Update result:', updateRes.status);
    console.log('Updated data:', JSON.stringify(updateRes.data.data.data, null, 2));
    
  } catch (error) {
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testRecordUpdate();
