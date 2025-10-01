// Test database connections
console.log('🔍 Testing database connections...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`);
console.log(`   PG_DATABASE: ${process.env.PG_DATABASE ? 'SET' : 'NOT SET'}`);
console.log(`   PG_USER: ${process.env.PG_USER ? 'SET' : 'NOT SET'}`);
console.log(`   PG_PASSWORD: ${process.env.PG_PASSWORD ? 'SET' : 'NOT SET'}`);
console.log(`   PG_HOST: ${process.env.PG_HOST ? 'SET' : 'NOT SET'}`);

// Test simple import
console.log('\n📋 Testing imports...');
try {
  const mongoose = await import('mongoose');
  console.log('   ✅ Mongoose imported successfully');
} catch (error) {
  console.log('   ❌ Mongoose import failed:', error.message);
}

try {
  const { sequelize } = await import('./src/models/postgres/index.js');
  console.log('   ✅ Sequelize imported successfully');
} catch (error) {
  console.log('   ❌ Sequelize import failed:', error.message);
}

try {
  const { createMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
  console.log('   ✅ MetabaseTableCreator imported successfully');
} catch (error) {
  console.log('   ❌ MetabaseTableCreator import failed:', error.message);
}

console.log('\n✅ Connection test completed!');
