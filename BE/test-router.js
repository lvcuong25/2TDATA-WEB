import express from "express";
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing router import...');

try {
  const router = await import('./src/router/index.js');
  console.log('✅ Router imported successfully');
  
  const app = express();
  app.use(express.json());
  app.use('/api', router.default);
  
  console.log('✅ Router configured successfully');
  
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server with router started on port ${PORT}`);
  });
  
} catch (error) {
  console.error('❌ Router import failed:', error);
}
