import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('Testing database connection...');
    console.log('DB_URI:', process.env.DB_URI);
    
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Database connected successfully!');
    
    // Test a simple query
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.ping();
    console.log('✅ Database ping successful:', result);
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();
