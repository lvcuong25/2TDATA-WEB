import dotenv from 'dotenv';

dotenv.config();

// Set environment variables for PostgreSQL
process.env.PG_DATABASE = process.env.POSTGRES_DB;
process.env.PG_USER = process.env.POSTGRES_USER;
process.env.PG_PASSWORD = process.env.POSTGRES_PASSWORD;
process.env.PG_HOST = process.env.POSTGRES_HOST;
process.env.PG_PORT = process.env.POSTGRES_PORT;

console.log('🔍 Testing Metabase sync step by step...\n');

// Step 1: Test environment variables
console.log('📋 Step 1: Environment variables');
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`);
console.log(`   PG_DATABASE: ${process.env.PG_DATABASE ? 'SET' : 'NOT SET'}`);
console.log(`   PG_USER: ${process.env.PG_USER ? 'SET' : 'NOT SET'}`);
console.log(`   PG_PASSWORD: ${process.env.PG_PASSWORD ? 'SET' : 'NOT SET'}`);
console.log(`   PG_HOST: ${process.env.PG_HOST ? 'SET' : 'NOT SET'}`);

// Step 2: Test MongoDB connection
console.log('\n📋 Step 2: Testing MongoDB connection...');
try {
  const mongoose = await import('mongoose');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('   ✅ MongoDB connected successfully');
  
  // Test a simple query
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`   ✅ Found ${collections.length} collections`);
  
  await mongoose.disconnect();
  console.log('   ✅ MongoDB disconnected');
} catch (error) {
  console.log('   ❌ MongoDB connection failed:', error.message);
}

// Step 3: Test PostgreSQL connection
console.log('\n📋 Step 3: Testing PostgreSQL connection...');
try {
  const { sequelize } = await import('./src/models/postgres/index.js');
  await sequelize.authenticate();
  console.log('   ✅ PostgreSQL connected successfully');
  
  // Test a simple query
  const [results] = await sequelize.query('SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = \'public\'');
  console.log(`   ✅ Found ${results[0].count} tables in public schema`);
  
  await sequelize.close();
  console.log('   ✅ PostgreSQL disconnected');
} catch (error) {
  console.log('   ❌ PostgreSQL connection failed:', error.message);
}

// Step 4: Test Metabase table creator
console.log('\n📋 Step 4: Testing Metabase table creator...');
try {
  const { createMetabaseTable } = await import('./src/utils/metabaseTableCreator.js');
  console.log('   ✅ MetabaseTableCreator imported successfully');
} catch (error) {
  console.log('   ❌ MetabaseTableCreator import failed:', error.message);
}

console.log('\n✅ Step-by-step test completed!');
