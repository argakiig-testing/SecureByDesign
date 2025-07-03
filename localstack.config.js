/**
 * LocalStack Configuration for ModInfra Testing
 */

module.exports = {
  // LocalStack endpoint configuration
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  
  // AWS configuration for LocalStack
  aws: {
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
    s3ForcePathStyle: true, // Required for LocalStack S3
  },
  
  // Services to test against
  services: [
    'ec2',
    'iam', 
    'sts',
    'cloudformation',
    'logs',
    'cloudwatch'
  ],
  
  // Test timeouts
  timeouts: {
    startup: 30000,      // 30 seconds for LocalStack to start
    operation: 10000,    // 10 seconds for AWS operations
    cleanup: 5000,       // 5 seconds for cleanup operations
  },
  
  // Retry configuration
  retry: {
    maxAttempts: 3,
    delay: 1000,
  },
  
  // Health check configuration
  healthCheck: {
    endpoint: '/health',
    timeout: 5000,
    retries: 10,
    interval: 1000,
  },
  
  // Docker configuration (for CI environments)
  docker: {
    image: 'localstack/localstack:3.0',
    ports: {
      4566: 4566, // Main LocalStack port
    },
    environment: {
      SERVICES: 'ec2,iam,sts,cloudformation,logs,cloudwatch',
      DEBUG: '0',
      AWS_DEFAULT_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'test',
      AWS_SECRET_ACCESS_KEY: 'test',
      HOSTNAME_EXTERNAL: 'localhost',
    },
    healthCheck: {
      test: ['CMD', 'curl', '-f', 'http://localhost:4566/health'],
      interval: '10s',
      timeout: '5s',
      retries: 5,
      startPeriod: '30s',
    },
  },
}; 