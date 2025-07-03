// Jest setup for Pulumi testing
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test timeout for longer operations
jest.setTimeout(30000);
