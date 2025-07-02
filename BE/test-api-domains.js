import axios from 'axios';

/**
 * Test API endpoints with different domains to verify site detection
 */
const testApiDomains = async () => {
  const basePort = process.env.PORT || 3000;
  
  const testDomains = [
    'localhost',
    'site1.localhost',
    'site2.localhost', 
    'site3.localhost',
    'techhub.localhost',
    'finance.localhost',
    'health.localhost'
  ];

  console.log('🧪 Testing API with different domains...');
  console.log(`🔗 Base URL: http://localhost:${basePort}`);

  for (const domain of testDomains) {
    console.log(`\n🌐 Testing domain: ${domain}`);
    
    try {
      // Test a simple API endpoint with different Host headers
      const response = await axios.get(`http://localhost:${basePort}/api/sites/current`, {
        headers: {
          'Host': domain
        },
        timeout: 5000
      });

      console.log(`   ✅ Response: ${response.status}`);
      if (response.data && response.data.site) {
        console.log(`   📍 Site detected: ${response.data.site.name}`);
        console.log(`   🌍 Site domains: ${response.data.site.domains.join(', ')}`);
      } else {
        console.log(`   📋 Response data:`, response.data);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ HTTP Error: ${error.response.status} - ${error.response.statusText}`);
        console.log(`   📝 Error data:`, error.response.data);
      } else if (error.request) {
        console.log(`   ❌ Network Error: No response received`);
      } else {
        console.log(`   ❌ Request Error: ${error.message}`);
      }
    }
  }

  console.log('\n🎯 Test Instructions:');
  console.log('=====================================');
  console.log('1. Make sure your server is running with: npm run dev');
  console.log('2. Add entries to your hosts file:');
  console.log('   Windows: C:\\Windows\\System32\\drivers\\etc\\hosts');
  console.log('   macOS/Linux: /etc/hosts');
  console.log('');
  console.log('   127.0.0.1    site1.localhost');
  console.log('   127.0.0.1    site2.localhost');
  console.log('   127.0.0.1    site3.localhost');
  console.log('   127.0.0.1    techhub.localhost');
  console.log('   127.0.0.1    finance.localhost');
  console.log('   127.0.0.1    health.localhost');
  console.log('');
  console.log('3. Test in browser:');
  console.log(`   - http://localhost:${basePort}/api/sites/current`);
  console.log(`   - http://site1.localhost:${basePort}/api/sites/current`);
  console.log(`   - http://techhub.localhost:${basePort}/api/sites/current`);
};

// Run the test
testApiDomains()
  .then(() => {
    console.log('\n✅ API domain test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ API domain test failed:', error.message);
    process.exit(1);
  });
