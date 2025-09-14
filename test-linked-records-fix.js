#!/usr/bin/env node

// Test script for the linked records fix
const http = require('http');

// Test configuration
const API_BASE = 'http://localhost:3004/api';
const loginData = {
  email: 'superadmin@2tdata.com',
  password: 'admin123'
};

// Helper function to make HTTP requests
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${body}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testLinkedRecordsFix() {
  try {
    console.log('🔧 Testing Linked Records Fix...');
    
    // Step 1: Login
    console.log('\n1. Testing login...');
    const loginResponse = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST'
    }, loginData);
    
    if (loginResponse.statusCode === 200) {
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }

    // Step 2: Test record update with proper recordId
    console.log('\n2. Testing record update with valid data...');
    const testRecordId = '507f1f77bcf86cd799439011'; // Mock record ID for testing
    const testData = {
      data: {
        'Test Field': 'Test Value',
        'Linked Field': '507f1f77bcf86cd799439012'
      }
    };

    const updateResponse = await makeRequest(`${API_BASE}/database/records/${testRecordId}`, {
      method: 'PUT',
      headers: {
        'Cookie': loginResponse.headers['set-cookie']?.join('; ') || ''
      }
    }, testData);

    console.log('Update Response Status:', updateResponse.statusCode);
    console.log('Update Response Data:', updateResponse.data);

    if (updateResponse.statusCode === 400 && updateResponse.data?.message === 'Record not found') {
      console.log('✅ Expected error for non-existent record - validation is working');
    } else if (updateResponse.statusCode === 200) {
      console.log('✅ Record update successful');
    } else {
      console.log('ℹ️  Response:', updateResponse.statusCode, updateResponse.data);
    }

    // Step 3: Test with undefined recordId (this should fail gracefully)
    console.log('\n3. Testing record update with undefined recordId...');
    const undefinedResponse = await makeRequest(`${API_BASE}/database/records/undefined`, {
      method: 'PUT',
      headers: {
        'Cookie': loginResponse.headers['set-cookie']?.join('; ') || ''
      }
    }, testData);

    console.log('Undefined Record ID Response Status:', undefinedResponse.statusCode);
    console.log('Undefined Record ID Response Data:', undefinedResponse.data);

    if (undefinedResponse.statusCode === 400 && undefinedResponse.data?.message === 'Valid record ID is required') {
      console.log('✅ Undefined recordId properly handled');
    } else {
      console.log('❌ Undefined recordId not properly handled');
    }

    // Step 4: Test with missing data (this should fail)
    console.log('\n4. Testing record update with missing data...');
    const missingDataResponse = await makeRequest(`${API_BASE}/database/records/${testRecordId}`, {
      method: 'PUT',
      headers: {
        'Cookie': loginResponse.headers['set-cookie']?.join('; ') || ''
      }
    }, {});

    console.log('Missing Data Response Status:', missingDataResponse.statusCode);
    console.log('Missing Data Response Data:', missingDataResponse.data);

    if (missingDataResponse.statusCode === 400 && missingDataResponse.data?.message === 'Data is required and must be an object') {
      console.log('✅ Missing data properly handled');
    } else {
      console.log('❌ Missing data not properly handled');
    }

    console.log('\n🎉 Linked Records Fix Test Completed!');
    console.log('\n📝 Summary:');
    console.log('- Fixed undefined recordId issue in frontend components');
    console.log('- Added proper validation for recordId in backend');
    console.log('- Improved data object validation');
    console.log('- LinkedTableDropdown now directly calls updateRecordMutation');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testLinkedRecordsFix();
