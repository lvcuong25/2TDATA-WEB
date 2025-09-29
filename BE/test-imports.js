console.log('🧪 Testing Imports...');
console.log('====================');

try {
  console.log('🔄 Testing hybrid-db import...');
  const { hybridDbManager } = await import('./src/config/hybrid-db.js');
  console.log('✅ hybrid-db imported successfully');

  console.log('🔄 Testing postgres models import...');
  const { syncModels } = await import('./src/models/postgres/index.js');
  console.log('✅ postgres models imported successfully');

  console.log('🔄 Testing postgres routes import...');
  const postgresRoutes = await import('./src/routes/postgresRoutes.js');
  console.log('✅ postgres routes imported successfully');

  console.log('🔄 Testing router import...');
  const router = await import('./src/router/index.js');
  console.log('✅ router imported successfully');

  console.log('\n🎉 All imports successful!');

} catch (error) {
  console.error('❌ Import error:', error.message);
  console.error('Stack:', error.stack);
}

