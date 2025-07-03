/**
 * Jest setup for LocalStack integration tests
 */

const waitPort = require('wait-port');
const localstackConfig = require('./localstack.config');

// Global test timeout for integration tests
jest.setTimeout(60000);

// Set environment variables for LocalStack
process.env.AWS_ENDPOINT_URL = localstackConfig.endpoint;
process.env.AWS_DEFAULT_REGION = localstackConfig.aws.region;
process.env.AWS_ACCESS_KEY_ID = localstackConfig.aws.accessKeyId;
process.env.AWS_SECRET_ACCESS_KEY = localstackConfig.aws.secretAccessKey;
process.env.LOCALSTACK_ENDPOINT = localstackConfig.endpoint;

// Pulumi configuration for LocalStack
process.env.PULUMI_CONFIG_PASSPHRASE = 'test';
process.env.PULUMI_SKIP_UPDATE_CHECK = 'true';
process.env.PULUMI_EXPERIMENTAL = 'true';

/**
 * Wait for LocalStack to be ready
 */
async function waitForLocalStack() {
  const maxRetries = localstackConfig.healthCheck.retries;
  const retryInterval = localstackConfig.healthCheck.interval;

  console.log('🔄 Waiting for LocalStack to be ready...');

  try {
    // Wait for port to be available
    await waitPort({
      host: 'localhost',
      port: 4566,
      timeout: localstackConfig.timeouts.startup,
      output: 'silent',
    });

    // Additional health check
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`${localstackConfig.endpoint}/_localstack/health`);
        if (response.ok) {
          const health = await response.json();
          const ec2Status = health.services?.ec2 || 'unknown';

          if (ec2Status === 'available' || ec2Status === 'running') {
            console.log('✅ LocalStack is ready!');
            return;
          }
        }
      } catch (error) {
        // Ignore and retry
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }

    throw new Error('LocalStack health check failed');
  } catch (error) {
    console.error('❌ LocalStack failed to start:', error.message);
    throw error;
  }
}

/**
 * Global setup before all integration tests
 */
beforeAll(async () => {
  // Check if LocalStack is running, if not, provide helpful error
  try {
    await waitForLocalStack();
  } catch (error) {
    console.error('\n🚨 LocalStack Integration Test Setup Failed');
    console.error('');
    console.error('To run integration tests, start LocalStack first:');
    console.error('  docker compose up -d localstack');
    console.error('');
    console.error('Or run integration tests with LocalStack:');
    console.error('  npm run test:integration:local');
    console.error('');
    throw error;
  }
});

/**
 * Global setup after all integration tests
 */
afterAll(async () => {
  // Allow some time for cleanup
  await new Promise(resolve => setTimeout(resolve, 1000));
});
