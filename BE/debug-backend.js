import express from 'express';
import { hybridDbManager } from './src/config/hybrid-db.js';
import { syncModels } from './src/models/postgres/index.js';
import postgresRoutes from './src/routes/postgresRoutes.js';

console.log('🔍 Debugging Backend...');
console.log('======================');

const app = express();
const PORT = 3004;

app.use(express.json());

// Test hybrid database connection
app.get('/debug-hybrid', async (req, res) => {
  try {
    console.log('🔄 Connecting to hybrid database system...');
    await hybridDbManager.connectAll();
    
    console.log('🔄 Syncing PostgreSQL models...');
    await syncModels(false);
    
    res.json({
      status: 'success',
      message: 'Hybrid database system connected!',
      mongo: hybridDbManager.isMongoConnected(),
      postgres: hybridDbManager.isPostgresConnected()
    });
  } catch (error) {
    console.error('❌ Hybrid database error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Test postgres routes
app.use('/api/postgres', postgresRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Debug backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Debug backend started on port ${PORT}`);
  console.log(`🔗 Debug hybrid: http://localhost:${PORT}/debug-hybrid`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Postgres: http://localhost:${PORT}/api/postgres/tables`);
});

// Keep running
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down...');
  await hybridDbManager.disconnectAll();
  process.exit(0);
});

