const axios = require('axios');

async function test() {
  try {
    console.log('Testing login...');
    const response = await axios.post('http://localhost:3004/api/auth/sign-in', {
      email: 'test@hcw.com.vn',
      password: 'Test123'
    });
    console.log('Login success:', response.status);
    
    const token = response.data.accessToken;
    console.log('Testing table structure...');
    const structureResponse = await axios.get('http://localhost:3004/api/database/tables/601e2a34-6a7e-4ef1-99eb-65648739b0d9/structure', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Structure response:', structureResponse.status);
    console.log('Columns count:', structureResponse.data.data.columns.length);
  } catch (error) {
    console.log('Error:', error.message);
  }
}

test();
