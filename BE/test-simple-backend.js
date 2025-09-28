import express from 'express';
import { hybridDbManager } from './src/config/hybrid-db.js';
import { syncModels } from './src/models/postgres/index.js';
import postgresRoutes from './src/routes/postgresRoutes.js';

console.log('🧪 Testing Simple Backend...');
console.log('============================');

const app = express();
const PORT = 3005; // Use different port to avoid conflict

app.use(express.json());

// Test hybrid database connection
app.get('/test-hybrid', async (req, res) => {
  try {
    await hybridDbManager.connectAll();
    await syncModels(false);
    
    res.json({
      status: 'success',
      message: 'Hybrid database system connected!',
      mongo: hybridDbManager.isMongoConnected(),
      postgres: hybridDbManager.isPostgresConnected()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Test postgres routes
app.use('/api/postgres', postgresRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test backend started on port ${PORT}`);
  console.log(`🔗 Test hybrid: http://localhost:${PORT}/test-hybrid`);
  console.log(`🔗 Test postgres: http://localhost:${PORT}/api/postgres/tables`);
});

// Keep running
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down...');
  await hybridDbManager.disconnectAll();
  process.exit(0);
});

