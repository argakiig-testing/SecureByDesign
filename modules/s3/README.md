# S3 Module

Secure-by-default S3 bucket component for the Modular Pulumi AWS Framework.

## Overview

The S3 module provides a production-ready S3 bucket with security best practices built-in by default. It automatically configures encryption, versioning, public access blocking, and intelligent lifecycle management to ensure your data is secure and cost-optimized.

## Features

### Security First

- **Encryption at rest** enabled by default (AES256)
- **Public access blocked** by default
- **Versioning enabled** for data protection
- **SSL/TLS enforcement** options
- **Bucket policies** with least-privilege access
- **MFA delete** support for critical data

### Cost Optimization

- **Intelligent tiering** lifecycle rules
- **Automatic archival** to Glacier and Deep Archive
- **Cleanup** of incomplete multipart uploads
- **Non-current version management**

### Operational Excellence

- **Event notifications** for monitoring
- **Access logging** support
- **CORS configuration** for web applications
- **Static website hosting** capabilities
- **Comprehensive tagging** for resource management

## Quick Start

```typescript
import { S3Component } from '@modinfra/s3';

// Create a basic secure bucket
const bucket = new S3Component('documents', {
  name: 'my-company-documents',
});

// Access bucket properties
console.log(bucket.bucketName);
console.log(bucket.bucketArn);
```

## Configuration Options

### Basic Configuration

```typescript
const bucket = new S3Component('basic', {
  name: 'my-bucket-name', // Required: Bucket name (must be globally unique)
  forceDestroy: false, // Optional: Allow deletion of non-empty bucket
  tags: {
    // Optional: Custom tags
    Environment: 'production',
    Project: 'my-project',
  },
});
```

### Encryption Configuration

```typescript
// AES256 encryption (default)
const bucket = new S3Component('aes', {
  name: 'my-encrypted-bucket',
  encryption: {
    sseAlgorithm: 'AES256',
    bucketKeyEnabled: true,
  },
});

// KMS encryption
const bucket = new S3Component('kms', {
  name: 'my-kms-bucket',
  encryption: {
    sseAlgorithm: 'aws:kms',
    kmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
    bucketKeyEnabled: true,
  },
});
```

### Versioning Configuration

```typescript
const bucket = new S3Component('versioned', {
  name: 'my-versioned-bucket',
  versioning: {
    enabled: true, // Enable versioning (default: true)
    mfaDelete: false, // Require MFA for deletion (default: false)
  },
});
```

### Lifecycle Rules

```typescript
const bucket = new S3Component('lifecycle', {
  name: 'my-lifecycle-bucket',
  lifecycleRules: [
    {
      id: 'archive-old-data',
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
  ],
});
```

### Website Hosting

```typescript
const websiteBucket = new S3Component('website', {
  name: 'my-website-bucket',
  website: {
    indexDocument: 'index.html',
    errorDocument: 'error.html',
  },
  corsRules: [
    {
      allowedMethods: ['GET', 'HEAD'],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
      maxAgeSeconds: 3600,
    },
  ],
});
```

### Event Notifications

```typescript
const bucket = new S3Component('notifications', {
  name: 'my-notifications-bucket',
  notification: {
    lambdaFunctions: [
      {
        lambdaFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:process-uploads',
        events: ['s3:ObjectCreated:*'],
        filterPrefix: 'uploads/',
      },
    ],
    topics: [
      {
        topicArn: 'arn:aws:sns:us-east-1:123456789012:my-alerts',
        events: ['s3:ObjectRemoved:*'],
      },
    ],
  },
});
```

### Public Access Configuration

```typescript
// Default: Block all public access (recommended)
const secureBucket = new S3Component('secure', {
  name: 'my-secure-bucket',
  blockPublicAcls: true, // Block public ACLs
  blockPublicPolicy: true, // Block public bucket policies
  ignorePublicAcls: true, // Ignore public ACLs
  restrictPublicBuckets: true, // Restrict public buckets
});

// For specific use cases requiring public access (use with caution)
const publicBucket = new S3Component('public', {
  name: 'my-public-bucket',
  blockPublicAcls: false,
  blockPublicPolicy: false,
  ignorePublicAcls: false,
  restrictPublicBuckets: false,
});
```

## Security Methods

### Grant Access Policies

```typescript
const bucket = new S3Component('access', {
  name: 'my-access-bucket',
});

// Grant read access to a specific IAM principal
const readPolicy = bucket.grantReadAccess('arn:aws:iam::123456789012:role/MyReadRole');

// Grant write access
const writePolicy = bucket.grantWriteAccess('arn:aws:iam::123456789012:role/MyWriteRole');

// Grant full access
const fullPolicy = bucket.grantFullAccess('arn:aws:iam::123456789012:role/MyAdminRole');
```

### Secure Bucket Policies

```typescript
// Create a secure policy with multiple security features
const securePolicy = bucket.createSecurePolicy({
  allowCloudFront: true, // Allow CloudFront access
  allowedPrincipals: [
    // Specific IAM principals
    'arn:aws:iam::123456789012:role/MyRole',
  ],
  denyInsecureTransport: true, // Deny HTTP (require HTTPS)
  enforceSSL: true, // Enforce SSL/TLS
});
```

## Common Use Cases

### Document Storage

```typescript
import { S3Component } from '@modinfra/s3';

const documentBucket = new S3Component('documents', {
  name: 'company-documents',
  encryption: {
    sseAlgorithm: 'AES256',
  },
  lifecycleRules: [
    {
      id: 'archive-old-documents',
      enabled: true,
      transitions: [
        { days: 90, storageClass: 'STANDARD_IA' },
        { days: 365, storageClass: 'GLACIER' },
      ],
    },
  ],
  tags: {
    Environment: 'production',
    DataClassification: 'internal',
  },
});
```

### Backup Storage

```typescript
const backupBucket = new S3Component('backups', {
  name: 'system-backups',
  versioning: {
    enabled: true,
    mfaDelete: true,
  },
  lifecycleRules: [
    {
      id: 'backup-lifecycle',
      enabled: true,
      transitions: [
        { days: 1, storageClass: 'STANDARD_IA' },
        { days: 7, storageClass: 'GLACIER' },
        { days: 30, storageClass: 'DEEP_ARCHIVE' },
      ],
      expiration: { days: 2555 }, // 7 years
    },
  ],
  notification: {
    topics: [
      {
        topicArn: 'arn:aws:sns:us-east-1:123456789012:backup-alerts',
        events: ['s3:ObjectCreated:*', 's3:ObjectRemoved:*'],
      },
    ],
  },
});
```

### Static Website

```typescript
const websiteBucket = new S3Component('website', {
  name: 'company-website',
  website: {
    indexDocument: 'index.html',
    errorDocument: 'error.html',
  },
  corsRules: [
    {
      allowedMethods: ['GET', 'HEAD'],
      allowedOrigins: ['https://example.com'],
      maxAgeSeconds: 3600,
    },
  ],
});

// Use with CloudFront for better security and performance
const cloudfrontPolicy = websiteBucket.createSecurePolicy({
  allowCloudFront: true,
  denyInsecureTransport: true,
});
```

### Data Lake Storage

```typescript
const dataLakeBucket = new S3Component('data-lake', {
  name: 'company-data-lake',
  encryption: {
    sseAlgorithm: 'aws:kms',
    kmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/my-key',
  },
  lifecycleRules: [
    {
      id: 'raw-data',
      prefix: 'raw/',
      transitions: [
        { days: 30, storageClass: 'STANDARD_IA' },
        { days: 90, storageClass: 'GLACIER' },
      ],
    },
    {
      id: 'processed-data',
      prefix: 'processed/',
      transitions: [
        { days: 180, storageClass: 'STANDARD_IA' },
        { days: 365, storageClass: 'GLACIER' },
      ],
    },
  ],
  notification: {
    lambdaFunctions: [
      {
        lambdaFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:data-processor',
        events: ['s3:ObjectCreated:*'],
        filterPrefix: 'raw/',
      },
    ],
  },
});
```

## Security Best Practices

### Default Security Posture

The S3 module enforces secure defaults:

1. **Encryption at rest** is enabled by default
2. **Public access is blocked** by default
3. **Versioning is enabled** to protect against accidental deletion
4. **SSL/TLS can be enforced** through bucket policies
5. **Access logging** can be enabled for audit trails

### Bucket Naming Security

```typescript
import { validateBucketName, generateSecureBucketName } from '@modinfra/s3';

// Validate bucket names before use
const validation = validateBucketName('my-bucket-name');
if (!validation.isValid) {
  console.error('Invalid bucket name:', validation.errors);
}

// Generate a secure, unique bucket name
const secureName = generateSecureBucketName('my-app');
```

### Access Control

```typescript
// Use IAM roles instead of hardcoded credentials
const bucket = new S3Component('secure', {
  name: 'my-secure-bucket',
});

// Grant minimal necessary permissions
const readOnlyAccess = bucket.grantReadAccess('arn:aws:iam::123456789012:role/ReadOnlyRole');

// Use conditions in bucket policies
const conditionalPolicy = bucket.createSecurePolicy({
  denyInsecureTransport: true,
  enforceSSL: true,
});
```

## Monitoring and Logging

### Access Logging

```typescript
const bucket = new S3Component('logged', {
  name: 'my-logged-bucket',
  logging: {
    targetBucket: 'my-access-logs-bucket',
    targetPrefix: 'access-logs/',
  },
});
```

### Event Notifications

```typescript
const monitoredBucket = new S3Component('monitored', {
  name: 'my-monitored-bucket',
  notification: {
    topics: [
      {
        topicArn: 'arn:aws:sns:us-east-1:123456789012:s3-events',
        events: ['s3:ObjectCreated:*', 's3:ObjectRemoved:*', 's3:ObjectTransition'],
      },
    ],
    lambdaFunctions: [
      {
        lambdaFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:s3-monitor',
        events: ['s3:ObjectRemoved:Delete'],
        filterPrefix: 'critical/',
      },
    ],
  },
});
```

## Cost Optimization

### Intelligent Tiering

The module includes intelligent tiering by default:

```typescript
// Default lifecycle rules are applied automatically
const bucket = new S3Component('cost-optimized', {
  name: 'my-cost-optimized-bucket',
  // Lifecycle rules are applied by default:
  // - STANDARD_IA after 30 days
  // - GLACIER after 90 days
  // - DEEP_ARCHIVE after 365 days
  // - Cleanup incomplete uploads after 7 days
  // - Remove non-current versions after 30 days
});
```

### Custom Lifecycle Rules

```typescript
const customBucket = new S3Component('custom-lifecycle', {
  name: 'my-custom-bucket',
  lifecycleRules: [
    {
      id: 'logs-lifecycle',
      prefix: 'logs/',
      enabled: true,
      transitions: [
        { days: 7, storageClass: 'STANDARD_IA' },
        { days: 30, storageClass: 'GLACIER' },
      ],
      expiration: { days: 365 },
    },
    {
      id: 'temp-cleanup',
      prefix: 'temp/',
      enabled: true,
      expiration: { days: 1 },
    },
  ],
});
```

## API Reference

### S3Component

Main component class for creating S3 buckets.

#### Constructor

```typescript
new S3Component(name: string, args: S3Args, opts?: ComponentResourceOptions)
```

#### Properties

| Property            | Type                                               | Description                       |
| ------------------- | -------------------------------------------------- | --------------------------------- |
| `bucket`            | `aws.s3.Bucket`                                    | The underlying S3 bucket resource |
| `publicAccessBlock` | `aws.s3.BucketPublicAccessBlock`                   | Public access block configuration |
| `encryption`        | `aws.s3.BucketServerSideEncryptionConfigurationV2` | Encryption configuration          |
| `versioning`        | `aws.s3.BucketVersioningV2`                        | Versioning configuration          |
| `lifecycle`         | `aws.s3.BucketLifecycleConfigurationV2`            | Lifecycle configuration           |
| `bucketName`        | `pulumi.Output<string>`                            | The bucket name                   |
| `bucketArn`         | `pulumi.Output<string>`                            | The bucket ARN                    |
| `bucketDomainName`  | `pulumi.Output<string>`                            | The bucket domain name            |

#### Methods

| Method                           | Description                       |
| -------------------------------- | --------------------------------- |
| `createSecurePolicy(options)`    | Create a secure bucket policy     |
| `grantReadAccess(principalArn)`  | Grant read access to a principal  |
| `grantWriteAccess(principalArn)` | Grant write access to a principal |
| `grantFullAccess(principalArn)`  | Grant full access to a principal  |

### Types

See the [types documentation](./types.ts) for complete type definitions.

### Defaults

See the [defaults documentation](./defaults.ts) for all default configurations and utilities.

## Examples

Complete examples are available in the [examples directory](../../examples/s3/):

- [Basic Bucket](../../examples/s3/basic-bucket.ts) - Simple secure bucket
- [Advanced Bucket](../../examples/s3/advanced-bucket.ts) - Custom configuration
- [Website Bucket](../../examples/s3/website-bucket.ts) - Static website hosting
- [Backup Bucket](../../examples/s3/backup-bucket.ts) - Backup and archival

## Testing

The module includes comprehensive test coverage:

```bash
# Run unit tests
npm run test:unit

# Run integration tests (requires LocalStack)
npm run test:integration

# Run all tests
npm test
```

## Contributing

Please see the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## License

This module is part of the Modular Pulumi AWS Framework and is licensed under the MIT License.
