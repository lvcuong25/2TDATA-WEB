import { createTable } from './src/controllers/tableController.js';

console.log('🧪 Testing Table Controller...');
console.log('==============================');

async function testTableController() {
  try {
    console.log('🔄 Testing createTable function...');
    
    // Mock request and response objects
    const mockReq = {
      body: {
        baseId: '68d792d5d5ea0d015b6b0170',
        name: 'Test Controller Table',
        description: 'Test table created via controller'
      },
      user: {
        _id: '68341e4d3f86f9c7ae46e962'
      },
      siteId: '686d45a89a0a0c37366567c8'
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`✅ Response ${code}:`, data);
        }
      })
    };

    // Test the controller function
    await createTable(mockReq, mockRes);

  } catch (error) {
    console.error('❌ Controller test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testTableController().catch(console.error);

