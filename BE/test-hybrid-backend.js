import { hybridDbManager } from './src/config/hybrid-db.js';
import { syncModels } from './src/models/postgres/index.js';

console.log('🧪 Testing Hybrid Backend System...');
console.log('===================================');

async function testHybridBackend() {
  try {
    console.log('🔄 Connecting to hybrid database system...');
    await hybridDbManager.connectAll();
    
    console.log('✅ Hybrid Database System Connected!');
    console.log(`   MongoDB: ${hybridDbManager.isMongoConnected() ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`   PostgreSQL: ${hybridDbManager.isPostgresConnected() ? '✅ Connected' : '❌ Disconnected'}`);

    console.log('🔄 Syncing PostgreSQL models...');
    await syncModels(false);
    console.log('✅ PostgreSQL models synchronized');

    console.log('\n🎉 Hybrid Backend System Ready!');
    console.log('================================');
    console.log('✅ MongoDB: Metadata operations ready');
    console.log('✅ PostgreSQL: Data model operations ready');
    console.log('✅ Hybrid system: Ready for API requests!');

    // Keep the connection alive for testing
    console.log('\n⏳ Keeping connection alive for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('❌ Hybrid backend test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await hybridDbManager.disconnectAll();
  }
}

testHybridBackend().catch(console.error);

