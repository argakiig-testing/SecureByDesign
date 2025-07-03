module.exports = {
  // Global configuration
  coverageReporters: ['text', 'lcov', 'html'],

  // Separate configuration for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src', '<rootDir>/modules'],
      testMatch: ['**/__tests__/**/*.test.ts'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      collectCoverageFrom: [
        'src/**/*.ts',
        'modules/**/*.ts',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/dist/**',
      ],
      coverageDirectory: 'coverage',
      // coverageReporters: ['text', 'lcov', 'html'], // Moved to root level
      moduleFileExtensions: ['ts', 'js', 'json'],
      testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src', '<rootDir>/modules'],
      testMatch: ['**/__tests__/**/*.integration.ts'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      collectCoverageFrom: [
        'src/**/*.ts',
        'modules/**/*.ts',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/dist/**',
      ],
      coverageDirectory: 'coverage',
      // coverageReporters: ['text', 'lcov', 'html'], // Moved to root level
      moduleFileExtensions: ['ts', 'js', 'json'],
      testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.integration.setup.js'],
      // testTimeout is set globally in jest.integration.setup.js
    },
  ],
};
