/**
 * Backup Bucket Example
 *
 * This example demonstrates creating an S3 bucket optimized for backups:
 * - Deep archive lifecycle rules
 * - Event notifications for monitoring
 * - Enhanced security settings
 * - Cost-optimized storage classes
 */

import { S3Component, S3_COMMON_EVENTS } from 'modular-pulumi-aws-framework';

// Create a bucket optimized for backup storage
const backupBucket = new S3Component('backups', {
  name: 'my-company-backups-bucket',

  // Enhanced versioning for backup integrity
  versioning: {
    enabled: true,
    mfaDelete: true, // Require MFA for deletion in production
  },

  // Aggressive lifecycle rules for cost optimization
  lifecycleRules: [
    {
      id: 'backup-archival',
      enabled: true,
      transitions: [
        {
          days: 7,
          storageClass: 'STANDARD_IA',
        },
        {
          days: 30,
          storageClass: 'GLACIER',
        },
        {
          days: 90,
          storageClass: 'DEEP_ARCHIVE',
        },
      ],
    },
    {
      id: 'database-backups',
      enabled: true,
      prefix: 'database/',
      transitions: [
        {
          days: 1,
          storageClass: 'STANDARD_IA',
        },
        {
          days: 7,
          storageClass: 'GLACIER',
        },
        {
          days: 30,
          storageClass: 'DEEP_ARCHIVE',
        },
      ],
      // Keep database backups for 7 years
      expiration: {
        days: 2555,
      },
      // Clean up old versions after 30 days
      noncurrentVersionExpiration: {
        noncurrentDays: 30,
      },
    },
    {
      id: 'log-backups',
      enabled: true,
      prefix: 'logs/',
      transitions: [
        {
          days: 30,
          storageClass: 'GLACIER',
        },
        {
          days: 90,
          storageClass: 'DEEP_ARCHIVE',
        },
      ],
      // Keep log backups for 1 year
      expiration: {
        days: 365,
      },
    },
    {
      id: 'cleanup-incomplete-uploads',
      enabled: true,
      abortIncompleteMultipartUpload: {
        daysAfterInitiation: 1,
      },
    },
  ],

  // Event notifications for backup monitoring
  notification: {
    lambdaFunctions: [
      {
        lambdaFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:backup-monitor',
        events: [S3_COMMON_EVENTS.OBJECT_CREATED, S3_COMMON_EVENTS.OBJECT_REMOVED],
      },
    ],
    topics: [
      {
        topicArn: 'arn:aws:sns:us-east-1:123456789012:backup-alerts',
        events: [S3_COMMON_EVENTS.OBJECT_REMOVED_DELETE],
        filterPrefix: 'critical/',
      },
    ],
  },

  // Enhanced security tags
  tags: {
    Environment: 'production',
    Project: 'backup-system',
    Owner: 'platform-team',
    DataClassification: 'confidential',
    BackupType: 'automated',
    RetentionPolicy: 'long-term',
  },
});

// Grant access to backup service roles
const backupServiceReadWrite = backupBucket.grantFullAccess(
  'arn:aws:iam::123456789012:role/BackupServiceRole'
);

const backupMonitoringRead = backupBucket.grantReadAccess(
  'arn:aws:iam::123456789012:role/BackupMonitoringRole'
);

// Export backup bucket information
export const backupBucketName = backupBucket.bucketName;
export const backupBucketArn = backupBucket.bucketArn;
export const backupServicePolicy = backupServiceReadWrite;
export const monitoringPolicy = backupMonitoringRead;
