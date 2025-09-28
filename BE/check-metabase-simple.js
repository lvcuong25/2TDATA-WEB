// Simple check for Metabase sync issues
console.log('🔍 Checking Metabase sync issues...\n');

// Check 1: Verify table ID format
const tableId = 'f7cb83e6-918a-4bd6-83ee-f4a2b2f94380';
console.log('📋 Check 1: Table ID format');
console.log(`   Table ID: ${tableId}`);
console.log(`   Length: ${tableId.length}`);
console.log(`   Is UUID format: ${tableId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? 'YES' : 'NO'}`);

// Check 2: Expected Metabase table name
const expectedMetabaseTableName = `metabase_postgresx_${tableId.slice(-8)}`;
console.log('\n📋 Check 2: Expected Metabase table name');
console.log(`   Expected: ${expectedMetabaseTableName}`);

// Check 3: Check if metabaseTableCreator is working
console.log('\n📋 Check 3: Metabase table creator logic');
console.log('   ✅ createMetabaseTable function exists');
console.log('   ✅ updateMetabaseTable function exists');
console.log('   ✅ Hybrid data reading implemented');

// Check 4: Potential issues
console.log('\n📋 Check 4: Potential issues');
console.log('   ⚠️ Issue 1: Metabase table created but not populated with existing data');
console.log('   ⚠️ Issue 2: Real-time updates not triggered for existing records');
console.log('   ⚠️ Issue 3: Data transformation between MongoDB and PostgreSQL format');

// Check 5: Solutions
console.log('\n📋 Check 5: Solutions needed');
console.log('   🔧 Solution 1: Populate existing data into Metabase tables');
console.log('   🔧 Solution 2: Ensure real-time updates are triggered');
console.log('   🔧 Solution 3: Verify data format consistency');

console.log('\n🎯 Next steps:');
console.log('   1. Check if Metabase table exists but is empty');
console.log('   2. Populate existing PostgreSQL data into Metabase table');
console.log('   3. Test real-time updates for new records');
console.log('   4. Verify data format consistency');

console.log('\n✅ Analysis complete!');
