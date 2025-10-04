import axios from 'axios';

console.log('🔍 Testing Server Status...');

async function testServerStatus() {
  try {
    // Test health endpoint
    console.log('📝 Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Server is running:', healthResponse.data);
    
    // Test root endpoint
    console.log('\n📝 Testing root endpoint...');
    const rootResponse = await axios.get('http://localhost:5000/api/');
    console.log('✅ Root endpoint working:', rootResponse.data);
    
    // Test database endpoint
    console.log('\n📝 Testing database endpoint...');
    const dbResponse = await axios.get('http://localhost:5000/api/database/');
    console.log('✅ Database endpoint working:', dbResponse.data);
    
  } catch (error) {
    console.log('❌ Server test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('📝 Server is not running on localhost:5000');
      console.log('📝 Please start the server with: npm run dev');
    } else {
      console.log('📝 Server error:', error.response?.data || error.message);
    }
  }
}

// Run the test
testServerStatus();


