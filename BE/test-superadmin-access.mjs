import fetch from 'node-fetch';

const API_URL = 'http://localhost:3004/api';

async function testSuperAdminAccess() {
  try {
    console.log('🔐 Đang đăng nhập với super admin...');
    
    // 1. Login
    const loginResponse = await fetch(`${API_URL}/auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'superadmin@2tdata.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Đăng nhập thất bại:', loginData);
      return;
    }
    
    // Extract cookie from response headers
    const cookies = loginResponse.headers.raw()['set-cookie'];
    const authToken = cookies?.find(cookie => cookie.includes('authToken'));
    
    if (!authToken) {
      console.error('❌ Không tìm thấy authToken trong response');
      return;
    }
    
    console.log('✅ Đăng nhập thành công');
    console.log('👤 User:', loginData.data?.email);
    console.log('📋 Role:', loginData.data?.role);
    
    // 2. Get all databases
    console.log('\n📂 Đang lấy danh sách database...');
    
    const dbResponse = await fetch(`${API_URL}/database/databases`, {
      method: 'GET',
      headers: {
        'Cookie': authToken
      }
    });
    
    const dbData = await dbResponse.json();
    
    if (!dbResponse.ok) {
      console.error('❌ Lỗi khi lấy database:', dbData);
      return;
    }
    
    // 3. Display results
    console.log('\n✅ KẾT QUẢ:');
    console.log(`📊 Tổng số database: ${dbData.data?.length || 0}`);
    
    if (dbData.data && dbData.data.length > 0) {
      console.log('\n📚 Danh sách database:');
      
      // Group by site
      const dbBySite = {};
      dbData.data.forEach(db => {
        const siteId = db.siteId || 'no-site';
        if (!dbBySite[siteId]) {
          dbBySite[siteId] = [];
        }
        dbBySite[siteId].push(db.name);
      });
      
      Object.keys(dbBySite).forEach(siteId => {
        console.log(`\n  Site ID: ${siteId}`);
        dbBySite[siteId].forEach(dbName => {
          console.log(`    • ${dbName}`);
        });
      });
      
      console.log('\n✅ SUPER ADMIN CÓ THỂ XEM TẤT CẢ DATABASE!');
    } else {
      console.log('⚠️ Không có database nào được trả về');
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

testSuperAdminAccess();
