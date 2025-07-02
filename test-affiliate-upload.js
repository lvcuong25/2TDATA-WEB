import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://techhub.localhost:3000/api';
const TEST_IMAGE_PATH = path.join(process.cwd(), 'BE', 'src', 'image', 'image.jpg');

// Test data
const LOGIN_DATA = {
  email: 'superadmin@2tdata.com',
  password: 'admin123'
};

async function testAffiliateSiteUpload() {
  console.log('🚀 Starting affiliate site upload test...');
  
  try {
    // Step 1: Login to get token
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(LOGIN_DATA)
    });
    
    const loginResult = await loginResponse.json();
    if (!loginResult.success) {
      throw new Error(`Login failed: ${loginResult.message}`);
    }
    
    const token = loginResult.data.accessToken;
    console.log('✅ Login successful');
    
    // Step 2: Get current site info
    console.log('\n2️⃣ Getting current site info...');
    const siteResponse = await fetch(`${BASE_URL}/sites/current`, {
      headers: {
        'Host': 'techhub.localhost:3000'
      }
    });
    
    const siteResult = await siteResponse.json();
    if (!siteResult.success) {
      throw new Error(`Site detection failed: ${siteResult.message}`);
    }
    
    console.log('✅ Site detected:', siteResult.data.name);
    const siteId = siteResult.data._id;
    
    // Step 3: Test color update (JSON)
    console.log('\n3️⃣ Testing color update...');
    const colorUpdateResponse = await fetch(`${BASE_URL}/admin/sites/${siteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Host': 'techhub.localhost:3000'
      },
      body: JSON.stringify({
        theme_config: {
          primaryColor: '#FF6B6B',
          secondaryColor: '#4ECDC4'
        }
      })
    });
    
    const colorResult = await colorUpdateResponse.json();
    if (colorResult.success) {
      console.log('✅ Color update successful');
    } else {
      console.log('❌ Color update failed:', colorResult.message);
    }
    
    // Step 4: Test logo upload (if image exists)
    if (fs.existsSync(TEST_IMAGE_PATH)) {
      console.log('\n4️⃣ Testing logo upload...');
      
      const formData = new FormData();
      formData.append('logo', fs.createReadStream(TEST_IMAGE_PATH));
      formData.append('theme_config', JSON.stringify({
        primaryColor: '#10B981',
        secondaryColor: '#065F46'
      }));
      
      const uploadResponse = await fetch(`${BASE_URL}/admin/sites/edit/${siteId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Host': 'techhub.localhost:3000',
          ...formData.getHeaders()
        },
        body: formData
      });
      
      const uploadResult = await uploadResponse.json();
      if (uploadResult.success) {
        console.log('✅ Logo upload successful');
      } else {
        console.log('❌ Logo upload failed:', uploadResult.message);
      }
    } else {
      console.log('\n4️⃣ ⚠️ Test image not found, skipping logo upload test');
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAffiliateSiteUpload();
