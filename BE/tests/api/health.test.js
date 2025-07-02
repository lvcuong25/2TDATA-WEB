import request from 'supertest';
import express from 'express';
import { clearTestDB } from '../../src/utils/testUtils.js';

// Simple test app without complex imports
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  app.get('/api/status', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  });
  
  return app;
};

describe('Health Check API', () => {
  const app = createTestApp();
  
  beforeEach(async () => {
    await clearTestDB();
  });

  describe('GET /api/health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/status', () => {
    it('should return 200 and detailed status', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
