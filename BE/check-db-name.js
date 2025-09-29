import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });
dotenv.config();

console.log('🔍 Checking Database Names...');
console.log('==============================');

async function checkDatabaseNames() {
  try {
    console.log('Environment MONGODB_URI:', process.env.MONGODB_URI);
    
    // Try to connect and list databases
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2TDATA');
    console.log('✅ Connected to MongoDB');
    
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    
    console.log('📊 Available databases:');
    dbs.databases.forEach(db => {
      console.log(`   ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Check current database
    console.log('Current database:', mongoose.connection.db.databaseName);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabaseNames().catch(console.error);
