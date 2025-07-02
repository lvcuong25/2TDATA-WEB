import { setupTestDB, teardownTestDB } from '../src/utils/testUtils.js';

// Global setup before all tests
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  await setupTestDB();
}, 30000);

// Global teardown after all tests
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  await teardownTestDB();
}, 30000);
