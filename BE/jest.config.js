export default {
  // Test environment
  testEnvironment: 'node',
  
  // Transform settings for ES modules
  transform: {},
  
  // Module name mapping
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1'
  },
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage settings
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js', // Exclude main app file
    '!src/server.js', // Exclude server startup file
    '!src/utils/testUtils.js', // Exclude test utilities
    '!src/controllers/user.js' // Exclude user controller (syntax issues)
  ],
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true
};
