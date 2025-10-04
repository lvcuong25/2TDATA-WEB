import axios from 'axios';

const BASE_URL = 'http://localhost:3004/api';
const TEST_COLUMN_ID = '49a7af36-b485-4083-8aea-3f6b7f4acb4c';
const TEST_USER_EMAIL = 'test@hcw.com.vn';
const TEST_USER_PASSWORD = 'Test123';

console.log('=== SIMULATING FRONTEND REQUEST ===');

async function simulateFrontendRequest() {
  try {
    // Step 1: Login as test@hcw.com.vn
    console.log('\n🔍 Step 1: Login as test@hcw.com.vn...');
    const loginRes = await axios.post(`${BASE_URL}/auth/sign-in`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    const token = loginRes.data.accessToken;
    const userId = loginRes.data.data._id;
    console.log('✅ Login successful');
    console.log('✅ User ID:', userId);
    
    // Step 2: Get user column permission (this is what frontend should call)
    console.log('\n🔍 Step 2: Getting user column permission (frontend should call this)...');
    const permissionRes = await axios.get(`${BASE_URL}/permissions/columns/${TEST_COLUMN_ID}/user-permission`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ User column permission Status:', permissionRes.status);
    console.log('✅ User column permission Data:', JSON.stringify(permissionRes.data, null, 2));
    
    // Step 3: Check if frontend should hide column
    const canView = permissionRes.data.data.canView;
    const canEdit = permissionRes.data.data.canEdit;
    
    console.log('\n🔍 Step 3: Frontend logic check...');
    console.log(`✅ Can View: ${canView}`);
    console.log(`✅ Can Edit: ${canEdit}`);
    
    if (!canView) {
      console.log('❌ FRONTEND SHOULD HIDE THIS COLUMN!');
    } else {
      console.log('✅ Frontend can show this column');
    }
    
    if (!canEdit) {
      console.log('❌ FRONTEND SHOULD DISABLE EDIT FOR THIS COLUMN!');
    } else {
      console.log('✅ Frontend can allow edit for this column');
    }
    
    // Step 4: Test table records API (to see if backend filters columns)
    console.log('\n🔍 Step 4: Testing table records API...');
    const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
    const recordsRes = await axios.get(`${BASE_URL}/database/tables/${tableId}/records`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Table records Status:', recordsRes.status);
    console.log('✅ Table records Data:', JSON.stringify(recordsRes.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data?.message);
    console.log('❌ Full error:', error.message);
    if (error.response?.data) {
      console.log('❌ Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

simulateFrontendRequest();
