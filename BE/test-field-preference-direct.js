import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing FieldPreference model directly...\n');

async function testFieldPreferenceModel() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ MongoDB connected successfully');
    
    // Import FieldPreference model
    console.log('\n🔄 Importing FieldPreference model...');
    const FieldPreference = await import('./src/model/fieldPreference.js');
    console.log('   ✅ FieldPreference model imported successfully');
    
    // Test with PostgreSQL UUID
    const testTableId = 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380';
    console.log(`\n🔄 Testing with table ID: ${testTableId}`);
    
    // Test find operation
    console.log('   Testing find operation...');
    let preference = await FieldPreference.default.findOne({ tableId: testTableId });
    console.log(`   ✅ Found preference: ${preference ? 'YES' : 'NO'}`);
    
    if (!preference) {
      console.log('   Creating new preference...');
      preference = new FieldPreference.default({
        tableId: testTableId,
        fieldVisibility: {},
        showSystemFields: false
      });
      await preference.save();
      console.log('   ✅ Created new preference');
    }
    
    // Test update operation
    console.log('\n🔄 Testing update operation...');
    preference.fieldVisibility = { 'Tên': true, 'Tuổi': true };
    await preference.save();
    console.log('   ✅ Updated preference');
    
    // Test find again
    console.log('\n🔄 Testing find operation again...');
    const updatedPreference = await FieldPreference.default.findOne({ tableId: testTableId });
    console.log(`   ✅ Found updated preference: ${updatedPreference ? 'YES' : 'NO'}`);
    console.log(`   Field visibility:`, updatedPreference.fieldVisibility);
    
    // Clean up
    console.log('\n🔄 Cleaning up...');
    await FieldPreference.default.deleteOne({ _id: preference._id });
    console.log('   ✅ Cleaned up test preference');
    
    await mongoose.disconnect();
    console.log('\n✅ MongoDB disconnected');
    
    return true;
  } catch (error) {
    console.log('   ❌ Test failed:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
    return false;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting FieldPreference model tests...\n');
    
    const result = await testFieldPreferenceModel();
    
    console.log('\n📊 Test Results Summary:');
    console.log(`   FieldPreference Model: ${result ? '✅ PASS' : '❌ FAIL'}`);
    
    if (result) {
      console.log('🎉 FieldPreference model test passed!');
    } else {
      console.log('❌ FieldPreference model test failed.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests
runTests();
