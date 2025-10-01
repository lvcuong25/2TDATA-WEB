import axios from 'axios';

console.log('🧪 Testing Backend Connection...');
console.log('================================');

async function testBackend() {
  try {
    // Test basic API
    console.log('🔄 Testing basic API...');
    const basicResponse = await axios.get('http://localhost:3004/api');
    console.log('✅ Basic API:', basicResponse.data.message);

    // Test health endpoint
    console.log('🔄 Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3004/api/health');
    console.log('✅ Health:', healthResponse.data.status);

    // Test PostgreSQL routes
    console.log('🔄 Testing PostgreSQL routes...');
    try {
      const postgresResponse = await axios.get('http://localhost:3004/api/postgres/tables');
      console.log('✅ PostgreSQL routes working');
    } catch (error) {
      console.log('❌ PostgreSQL routes not found:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test auth endpoint
    console.log('🔄 Testing auth endpoint...');
    try {
      const authResponse = await axios.get('http://localhost:3004/api/auth');
      console.log('✅ Auth endpoint accessible');
    } catch (error) {
      console.log('❌ Auth endpoint error:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Backend connection test completed!');

  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
  }
}

testBackend().catch(console.error);

