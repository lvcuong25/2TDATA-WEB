// Test script để kiểm tra site access control
// Chạy: node test-site-access.js

console.log('🧪 Testing Site Access Control');

// Simulate user data
const testUsers = [
  {
    _id: 'user1',
    email: 'user1@test.com',
    role: 'member',
    site_id: 'site_A_id'
  },
  {
    _id: 'user2', 
    email: 'admin@test.com',
    role: 'super_admin',
    site_id: null
  }
];

const testSites = [
  {
    _id: 'site_A_id',
    name: 'Site A',
    domains: ['site-a.localhost', 'dev.2tdata.com']
  },
  {
    _id: 'site_B_id', 
    name: 'Site B',
    domains: ['site-b.localhost', 'test.2tdata.com']
  }
];

// Test scenarios
console.log('\n📋 Test Scenarios:');

testUsers.forEach(user => {
  testSites.forEach(site => {
    const hasAccess = user.role === 'super_admin' || 
                     user.site_id === site._id;
    
    console.log(`👤 ${user.email} -> 🌐 ${site.name}: ${hasAccess ? '✅ ACCESS' : '❌ DENIED'}`);
  });
});

console.log('\n🔍 Implementation Logic:');
console.log('1. User thuộc site A tries to access site B -> DENIED');
console.log('2. Super admin can access any site -> ALLOWED');
console.log('3. When DENIED -> Show popup with auto-logout countdown');
console.log('4. After countdown or manual logout -> redirect to /');

console.log('\n📁 Files to check:');
console.log('- FE/src/components/SiteAccessChecker.jsx');
console.log('- FE/src/App.jsx (integration)');
console.log('- FE/src/context/SiteContext.jsx (site detection)');
