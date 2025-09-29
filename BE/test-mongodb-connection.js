import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing MongoDB connection...\n');

async function testMongoDBConnection() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log(`   MongoDB URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ MongoDB connected successfully');
    
    // Test FieldPreference model
    console.log('\n🔄 Testing FieldPreference model...');
    
    const FieldPreference = mongoose.model('FieldPreference', new mongoose.Schema({
      tableId: String,
      fieldVisibility: Object,
      showSystemFields: Boolean
    }));
    
    // Test find operation
    const preferences = await FieldPreference.find({}).limit(5);
    console.log(`   ✅ Found ${preferences.length} field preferences`);
    
    // Test create operation
    const testPreference = new FieldPreference({
      tableId: 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380',
      fieldVisibility: { 'Tên': true, 'Tuổi': true },
      showSystemFields: false
    });
    
    await testPreference.save();
    console.log('   ✅ Created test field preference');
    
    // Clean up
    await FieldPreference.deleteOne({ _id: testPreference._id });
    console.log('   ✅ Cleaned up test preference');
    
    await mongoose.disconnect();
    console.log('\n✅ MongoDB disconnected');
    
    return true;
  } catch (error) {
    console.log('   ❌ MongoDB connection failed:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
    return false;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting MongoDB connection tests...\n');
    
    const result = await testMongoDBConnection();
    
    console.log('\n📊 Test Results Summary:');
    console.log(`   MongoDB Connection: ${result ? '✅ PASS' : '❌ FAIL'}`);
    
    if (result) {
      console.log('🎉 MongoDB connection test passed!');
    } else {
      console.log('❌ MongoDB connection test failed.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests
runTests();
