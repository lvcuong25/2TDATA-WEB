import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3004/api';

async function login() {
  console.log('🔐 Logging in as superadmin...');
  
  const response = await fetch(`${API_BASE}/auth/sign-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'superadmin@2tdata.com',
      password: 'admin123'
    })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Login successful');
    return data.accessToken;
  } else {
    console.error('❌ Login failed:', data);
    return null;
  }
}

async function getUserServices(token) {
  console.log('📋 Getting user services...');
  
  const response = await fetch(`${API_BASE}/user/superadmin@2tdata.com/services`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Got services:', data.services?.length || 0);
    return data.services || [];
  } else {
    console.error('❌ Failed to get services:', data);
    return [];
  }
}

async function updateAutoSettings(token, serviceId) {
  console.log(`⚙️ Setting up auto-update for service ${serviceId}...`);
  
  const response = await fetch(`${API_BASE}/requests/${serviceId}/auto-update`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      enabled: true,
      interval: 1 // 1 phút
    })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Auto-update enabled successfully');
    return true;
  } else {
    console.error('❌ Failed to enable auto-update:', data);
    return false;
  }
}

async function main() {
  try {
    const token = await login();
    if (!token) return;
    
    const services = await getUserServices(token);
    if (services.length === 0) {
      console.log('❌ No services found for superadmin');
      return;
    }
    
    const service = services[0];
    console.log(`🎯 Using service: ${service.service?.name} (ID: ${service._id})`);
    
    const success = await updateAutoSettings(token, service._id);
    if (success) {
      console.log('\n🎉 Test setup completed!');
      console.log('💡 Auto-update is now enabled for 1-minute intervals');
      console.log('⏰ Check the frontend in 1-2 minutes to see "Đang cập nhật..." status');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main().catch(console.error);
