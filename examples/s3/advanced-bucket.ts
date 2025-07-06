/**
 * Advanced S3 Bucket Example
 *
 * This example demonstrates creating an S3 bucket with advanced configuration:
 * - Custom KMS encryption
 * - Custom lifecycle rules
 * - Access logging
 * - CORS configuration for web applications
 */

import { S3Component } from 'modular-pulumi-aws-framework';

// Create an advanced S3 bucket with custom configuration
const dataBucket = new S3Component('data', {
  name: 'my-company-data-bucket',

  // Use KMS encryption instead of AES256
  encryption: {
    sseAlgorithm: 'aws:kms',
    kmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
    bucketKeyEnabled: true,
  },

  // Custom lifecycle rules for data management
  lifecycleRules: [
    {
      id: 'data-archival',
      enabled: true,
      prefix: 'data/',
      transitions: [
        {
          days: 30,
          storageClass: 'STANDARD_IA',
        },
        {
          days: 90,
          storageClass: 'GLACIER',
        },
        {
          days: 365,
          storageClass: 'DEEP_ARCHIVE',
        },
      ],
      expiration: {
        days: 2555, // 7 years
      },
    },
    {
      id: 'temp-data-cleanup',
      enabled: true,
      prefix: 'temp/',
      expiration: {
        days: 7,
      },
    },
    {
      id: 'old-versions-cleanup',
      enabled: true,
      noncurrentVersionExpiration: {
        noncurrentDays: 90,
      },
    },
  ],

  // Enable access logging to another bucket
  logging: {
    targetBucket: 'my-company-access-logs-bucket',
    targetPrefix: 'data-bucket-logs/',
  },

  // CORS configuration for web application access
  corsRules: [
    {
      id: 'web-app-cors',
      allowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
      allowedOrigins: ['https://myapp.example.com'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-amz-date', 'x-amz-security-token'],
      exposeHeaders: ['ETag'],
      maxAgeSeconds: 3600,
    },
  ],

  // Custom tags
  tags: {
    Environment: 'production',
    Project: 'data-platform',
    Owner: 'data-team',
    CostCenter: '12345',
    DataClassification: 'internal',
  },
});

// Export bucket information
export const dataBucketName = dataBucket.bucketName;
export const dataBucketArn = dataBucket.bucketArn;
