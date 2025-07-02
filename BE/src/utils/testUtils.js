import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

/**
 * Connect to test database
 */
export const connectTestDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Test MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Test DB connection error:', error.message);
    process.exit(1);
  }
};

/**
 * Disconnect from test database
 */
export const disconnectTestDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('Test MongoDB Disconnected');
  } catch (error) {
    console.error('Test DB disconnection error:', error.message);
  }
};

/**
 * Clear all test data from database
 */
export const clearTestDB = async () => {
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    console.log('Test database cleared');
  } catch (error) {
    console.error('Error clearing test database:', error.message);
    throw error;
  }
};

/**
 * Setup test database before each test
 */
export const setupTestDB = async () => {
  await connectTestDB();
  await clearTestDB();
};

/**
 * Teardown test database after each test
 */
export const teardownTestDB = async () => {
  await clearTestDB();
  await disconnectTestDB();
};

/**
 * Create test user data
 */
export const createTestUser = () => ({
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpassword123',
  role: 'user'
});

/**
 * Create multiple test users
 */
export const createTestUsers = (count = 3) => {
  const users = [];
  for (let i = 1; i <= count; i++) {
    users.push({
      username: `testuser${i}`,
      email: `test${i}@example.com`,
      password: `testpassword${i}23`,
      role: i === 1 ? 'admin' : 'user'
    });
  }
  return users;
};

/**
 * Wait for a specified amount of time (useful for async operations)
 */
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
