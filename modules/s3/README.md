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
import { S3Component } from 'modular-pulumi-aws-framework';

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
    kmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/my-key',
    bucketKeyEnabled: true,
  },
});
```

### Versioning Configuration

```typescript
const bucket = new S3Component('versioned', {
  name: 'my-versioned-bucket',
  versioning: {
    enabled: true,
    mfaDelete: true, // Require MFA for permanent deletion
  },
});
```

### Lifecycle Rules

```typescript
const bucket = new S3Component('lifecycle', {
  name: 'my-bucket-with-lifecycle',
  lifecycleRules: [
    {
      id: 'archive-old-versions',
      enabled: true,
      prefix: 'data/',
      transitions: [
        { days: 30, storageClass: 'STANDARD_IA' },
        { days: 90, storageClass: 'GLACIER' },
        { days: 365, storageClass: 'DEEP_ARCHIVE' },
      ],
      noncurrentVersionExpiration: {
        noncurrentDays: 90,
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
    errorDocument: '404.html',
  },
  // Allow public read access for website content
  blockPublicAcls: false,
  blockPublicPolicy: false,
  ignorePublicAcls: false,
  restrictPublicBuckets: false,
});
```

### CORS Configuration

```typescript
const apiBucket = new S3Component('api-bucket', {
  name: 'my-api-bucket',
  corsRules: [
    {
      allowedHeaders: ['Content-Type', 'Authorization'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedOrigins: ['https://mydomain.com'],
      exposeHeaders: ['ETag'],
      maxAgeSeconds: 86400,
    },
  ],
});
```

### Event Notifications

```typescript
const notificationBucket = new S3Component('notifications', {
  name: 'my-notification-bucket',
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
        topicArn: 'arn:aws:sns:us-east-1:123456789012:bucket-notifications',
        events: ['s3:ObjectRemoved:*'],
      },
    ],
  },
});
```

## Advanced Examples

### Secure Data Lake Bucket

```typescript
import { S3Component } from 'modular-pulumi-aws-framework';

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
import { validateBucketName, generateSecureBucketName } from 'modular-pulumi-aws-framework';

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
const customPolicy = bucket.createSecurePolicy({
  allowCloudFront: true,
  denyInsecureTransport: true,
  enforceSSL: true,
});
```

## Integration Examples

### With VPC and Lambda

```typescript
import { VpcComponent, S3Component } from 'modular-pulumi-aws-framework';

const vpc = new VpcComponent('app-vpc', {
  name: 'app-vpc',
});

const dataBucket = new S3Component('data', {
  name: 'app-data-bucket',
  notification: {
    lambdaFunctions: [
      {
        lambdaFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:process-data',
        events: ['s3:ObjectCreated:*'],
      },
    ],
  },
});
```

### With CloudFront

```typescript
import { S3Component } from 'modular-pulumi-aws-framework';

const websiteBucket = new S3Component('website', {
  name: 'my-company-website',
  website: {
    indexDocument: 'index.html',
    errorDocument: 'error.html',
  },
});

// Create CloudFront-friendly bucket policy
const cloudFrontPolicy = websiteBucket.createSecurePolicy({
  allowCloudFront: true,
  denyInsecureTransport: true,
});
```

## API Reference

### S3Component

Main class for creating S3 buckets with secure defaults.

#### Constructor

```typescript
new S3Component(name: string, args: S3Args, opts?: ComponentResourceOptions)
```

#### Properties

| Property                     | Type                      | Description                       |
| ---------------------------- | ------------------------- | --------------------------------- |
| `bucket`                     | `aws.s3.Bucket`           | The S3 bucket resource            |
| `publicAccessBlock`          | `BucketPublicAccessBlock` | Public access block configuration |
| `encryption`                 | `BucketEncryption`        | Encryption configuration          |
| `versioning`                 | `BucketVersioning`        | Versioning configuration          |
| `bucketName`                 | `Output<string>`          | The bucket name                   |
| `bucketArn`                  | `Output<string>`          | The bucket ARN                    |
| `bucketDomainName`           | `Output<string>`          | The bucket domain name            |
| `bucketRegionalDomainName`   | `Output<string>`          | Regional domain name              |
| `websiteEndpoint` (optional) | `Output<string>`          | Website endpoint (if enabled)     |
| `websiteDomain` (optional)   | `Output<string>`          | Website domain (if enabled)       |

#### Methods

##### `createSecurePolicy(options)`

Creates a secure bucket policy with common security controls.

```typescript
bucket.createSecurePolicy({
  allowCloudFront?: boolean;
  allowedPrincipals?: string[];
  denyInsecureTransport?: boolean;
  enforceSSL?: boolean;
})
```

##### `grantReadAccess(principalArn)`

Grants read access to the bucket for the specified principal.

```typescript
bucket.grantReadAccess('arn:aws:iam::123456789012:role/ReadOnlyRole');
```

##### `grantWriteAccess(principalArn)`

Grants write access to the bucket for the specified principal.

```typescript
bucket.grantWriteAccess('arn:aws:iam::123456789012:role/DataProcessor');
```

##### `grantFullAccess(principalArn)`

Grants full access to the bucket for the specified principal.

```typescript
bucket.grantFullAccess('arn:aws:iam::123456789012:role/AdminRole');
```

## Utility Functions

### `validateBucketName(name)`

Validates a bucket name against AWS requirements.

```typescript
const validation = validateBucketName('my-bucket-name');
if (!validation.isValid) {
  console.error('Invalid bucket name:', validation.errors);
}
```

### `generateSecureBucketName(baseName)`

Generates a secure, globally unique bucket name.

```typescript
const bucketName = generateSecureBucketName('my-app');
// Returns: "my-app-1a2b3c4d-xyz123"
```

### `createSecureBucketPolicy(bucketName, options)`

Creates a secure bucket policy JSON string.

```typescript
const policy = createSecureBucketPolicy('my-bucket', {
  allowCloudFront: true,
  denyInsecureTransport: true,
});
```

## Best Practices

### Performance

1. **Use the right storage class** for your access patterns
2. **Enable transfer acceleration** for global access
3. **Use multipart uploads** for large objects
4. **Implement proper caching** with CloudFront

### Cost Optimization

1. **Set up lifecycle rules** to automatically transition old data
2. **Use Intelligent-Tiering** for unpredictable access patterns
3. **Monitor and analyze** access patterns regularly
4. **Clean up incomplete multipart uploads**

### Security

1. **Always use HTTPS** for bucket access
2. **Enable versioning** for critical data
3. **Use bucket policies** to restrict access
4. **Enable access logging** for audit trails
5. **Regularly review** bucket permissions

### Compliance

1. **Enable object lock** for regulatory compliance
2. **Use MFA delete** for critical buckets
3. **Implement proper** data retention policies
4. **Document data** classification and handling

## Troubleshooting

### Common Issues

#### 1. Bucket Name Already Exists

**Problem**: `BucketAlreadyExists` error

**Solution**: Use `generateSecureBucketName()` or choose a unique name

```typescript
import { generateSecureBucketName, validateBucketName } from 'modular-pulumi-aws-framework';

const bucketName = generateSecureBucketName('my-app');
const validation = validateBucketName(bucketName);
if (!validation.isValid) {
  console.error('Invalid bucket name:', validation.errors);
}
```

#### 2. Access Denied Errors

**Problem**: Cannot access bucket objects

**Solution**: Check bucket policy and IAM permissions

```typescript
// Grant appropriate access
const readAccess = bucket.grantReadAccess('arn:aws:iam::123456789012:role/MyRole');

// Or create a comprehensive policy
const policy = bucket.createSecurePolicy({
  allowedPrincipals: ['arn:aws:iam::123456789012:role/MyRole'],
  denyInsecureTransport: true,
});
```

#### 3. CORS Issues

**Problem**: Cross-origin requests blocked

**Solution**: Configure CORS rules properly

```typescript
const bucket = new S3Component('web-assets', {
  name: 'my-web-assets',
  corsRules: [
    {
      allowedOrigins: ['https://mydomain.com'],
      allowedMethods: ['GET', 'HEAD'],
      allowedHeaders: ['*'],
      maxAgeSeconds: 3600,
    },
  ],
});
```

#### 4. Lifecycle Rules Not Working

**Problem**: Objects not transitioning as expected

**Solution**: Check rule configuration and object tags

```typescript
const bucket = new S3Component('archived', {
  name: 'my-archived-bucket',
  lifecycleRules: [
    {
      id: 'archive-rule',
      enabled: true, // Make sure it's enabled
      prefix: 'archive/', // Check prefix matches your objects
      transitions: [{ days: 30, storageClass: 'STANDARD_IA' }],
    },
  ],
});
```

## Performance Optimization

### Large File Uploads

```typescript
// Configure multipart upload threshold
const bucket = new S3Component('uploads', {
  name: 'large-file-uploads',
  // Enable transfer acceleration
  accelerationStatus: 'Enabled',
});
```

### CloudFront Integration

```typescript
const websiteBucket = new S3Component('cdn', {
  name: 'my-cdn-bucket',
  website: {
    indexDocument: 'index.html',
  },
});

// Create CloudFront-optimized policy
const cdnPolicy = websiteBucket.createSecurePolicy({
  allowCloudFront: true,
  enforceSSL: true,
});
```

---

For additional questions or support, please refer to the [AWS S3 documentation](https://docs.aws.amazon.com/s3/) or open an issue in the repository.
