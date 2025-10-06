import fetch from 'node-fetch';

async function triggerAPI() {
  try {
    console.log('Logging in...');
    const loginResponse = await fetch('http://localhost:3004/api/auth/sign-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@hcw.com.vn',
        password: 'Test123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login status:', loginResponse.status);
    
    if (loginData.accessToken) {
      console.log('Testing table structure API...');
      const structureResponse = await fetch('http://localhost:3004/api/database/tables/601e2a34-6a7e-4ef1-99eb-65648739b0d9/structure', {
        headers: {
          'Authorization': `Bearer ${loginData.accessToken}`
        }
      });
      
      const structureData = await structureResponse.json();
      console.log('Structure status:', structureResponse.status);
      console.log('Columns count:', structureData.data?.columns?.length || 0);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

triggerAPI();
