# Testing Setup Guide

This directory contains the complete testing setup for the Node.js backend application.

## 📁 Structure

```
tests/
├── api/              # API endpoint tests
│   ├── auth.test.js  # Authentication API tests
│   └── health.test.js # Health check tests
├── models/           # Database model tests
│   └── user.test.js  # User model tests
├── setup.js          # Jest global setup
└── README.md         # This file
```

## 🚀 Quick Start

### 1. Start Test Database
```bash
npm run test:db:up
```

### 2. Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### 3. Stop Test Database
```bash
npm run test:db:down
```

## 🛠 Available Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:db:up` | Start test MongoDB container |
| `npm run test:db:down` | Stop test MongoDB container |
| `npm run test:db:reset` | Reset test database (remove all data) |

## 🗄 Database Configuration

The test environment uses a separate MongoDB instance running in Docker:

- **Host**: `localhost:27018`
- **Database**: `test_db`
- **Username**: `testuser`
- **Password**: `testpassword`

### Environment Variables (.env.test)
- `NODE_ENV=test`
- `MONGODB_URI=mongodb://testuser:testpassword@localhost:27018/test_db`
- `JWT_SECRET=test_jwt_secret_key_for_testing_only`

## 📝 Writing Tests

### API Tests
Located in `tests/api/`. Use supertest for HTTP testing:

```javascript
import request from 'supertest';
import app from '../../src/app.js';

describe('API Tests', () => {
  it('should test endpoint', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

### Model Tests
Located in `tests/models/`. Test database operations:

```javascript
import Model from '../../src/model/Model.js';
import { clearTestDB } from '../../src/utils/testUtils.js';

describe('Model Tests', () => {
  beforeEach(async () => {
    await clearTestDB();
  });

  it('should create model', async () => {
    const data = { field: 'value' };
    const model = await Model.create(data);
    expect(model.field).toBe('value');
  });
});
```

## 🧪 Test Utilities

The `src/utils/testUtils.js` file provides helpful functions:

- `connectTestDB()` - Connect to test database
- `disconnectTestDB()` - Disconnect from test database
- `clearTestDB()` - Clear all test data
- `setupTestDB()` - Setup database for testing
- `teardownTestDB()` - Cleanup after testing
- `createTestUser()` - Create test user data
- `createTestUsers(count)` - Create multiple test users

## 📊 Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `coverage/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI/CD

## 🔧 Configuration

### Jest Configuration (jest.config.js)
- ES modules support
- 30-second timeout
- Coverage collection from `src/**/*.js`
- Excludes app.js, server.js, and test utilities

### Docker Compose (docker-compose.test.yml)
- MongoDB 7.0
- Isolated test network
- Persistent volume for test data
- Optional MongoDB Express GUI

## 🚨 Important Notes

1. **Always start the test database** before running tests
2. **Tests use a separate database** - won't affect development data
3. **Database is cleared** before each test to ensure isolation
4. **Mock external services** (like email) in tests
5. **Use test-specific environment variables**

## 🐛 Troubleshooting

### Tests failing to connect to database
```bash
# Check if test database is running
docker ps

# Restart test database
npm run test:db:reset
```

### Port conflicts
If port 27018 is in use, modify `docker-compose.test.yml` and `.env.test`

### ES modules issues
Ensure `NODE_OPTIONS=--experimental-vm-modules` is set in test scripts

### Jest timeout
Increase timeout in `jest.config.js` if tests are slow

## 📚 Best Practices

1. **Write descriptive test names**
2. **Test both success and failure cases**
3. **Mock external dependencies**
4. **Keep tests isolated and independent**
5. **Use beforeEach/afterEach for cleanup**
6. **Organize tests by feature/module**
7. **Aim for good test coverage**
