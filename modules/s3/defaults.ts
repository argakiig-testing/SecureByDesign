/**
 * Secure defaults for S3 buckets
 */

import { S3LifecycleRule } from './types';

/**
 * Default encryption configuration for S3 buckets
 * Uses AES256 encryption by default for security
 */
export const S3_ENCRYPTION_DEFAULTS = {
  sseAlgorithm: 'AES256',
  bucketKeyEnabled: true,
} as const;

/**
 * Default versioning configuration for S3 buckets
 * Enables versioning by default for data protection
 */
export const S3_VERSIONING_DEFAULTS = {
  enabled: true,
  mfaDelete: false,
} as const;

/**
 * Default public access block configuration
 * Blocks all public access by default for security
 */
export const S3_PUBLIC_ACCESS_BLOCK_DEFAULTS = {
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
} as const;

/**
 * Default object ownership configuration
 * Uses BucketOwnerPreferred for better security
 */
export const S3_OBJECT_OWNERSHIP_DEFAULTS = {
  objectOwnership: 'BucketOwnerPreferred',
} as const;

/**
 * Default lifecycle rules for S3 buckets
 * Includes intelligent tiering and cleanup rules
 */
export const S3_LIFECYCLE_DEFAULTS: readonly S3LifecycleRule[] = [
  {
    id: 'intelligent-tiering',
    enabled: true,
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
  },
  {
    id: 'abort-incomplete-multipart-uploads',
    enabled: true,
    abortIncompleteMultipartUpload: {
      daysAfterInitiation: 7,
    },
  },
  {
    id: 'noncurrent-version-expiration',
    enabled: true,
    noncurrentVersionExpiration: {
      noncurrentDays: 30,
    },
  },
] as const;

/**
 * Default website configuration for static hosting
 */
export const S3_WEBSITE_DEFAULTS = {
  indexDocument: 'index.html',
  errorDocument: 'error.html',
} as const;

/**
 * Default request payer configuration
 */
export const S3_REQUEST_PAYER_DEFAULTS = {
  requestPayer: 'BucketOwner',
} as const;

/**
 * Default tags for S3 buckets
 */
export const S3_DEFAULT_TAGS = {
  ManagedBy: 'SecureByDesign',
  Component: 'S3',
  Environment: 'production',
  SecurityLevel: 'high',
} as const;

/**
 * Common S3 event types for notifications
 */
export const S3_COMMON_EVENTS = {
  // Object events
  OBJECT_CREATED: 's3:ObjectCreated:*',
  OBJECT_CREATED_PUT: 's3:ObjectCreated:Put',
  OBJECT_CREATED_POST: 's3:ObjectCreated:Post',
  OBJECT_CREATED_COPY: 's3:ObjectCreated:Copy',
  OBJECT_CREATED_MULTIPART: 's3:ObjectCreated:CompleteMultipartUpload',

  // Object removal events
  OBJECT_REMOVED: 's3:ObjectRemoved:*',
  OBJECT_REMOVED_DELETE: 's3:ObjectRemoved:Delete',
  OBJECT_REMOVED_DELETE_MARKER: 's3:ObjectRemoved:DeleteMarkerCreated',

  // Lifecycle events
  OBJECT_TRANSITION: 's3:ObjectTransition',
  OBJECT_RESTORE: 's3:ObjectRestore:*',
  OBJECT_RESTORE_POST: 's3:ObjectRestore:Post',
  OBJECT_RESTORE_COMPLETED: 's3:ObjectRestore:Completed',

  // Replication events
  REPLICATION: 's3:Replication:*',
  REPLICATION_FAILED: 's3:Replication:OperationFailedReplication',
  REPLICATION_MISSED: 's3:Replication:OperationMissedThreshold',
  REPLICATION_COMPLETED: 's3:Replication:OperationReplicatedAfterThreshold',
  REPLICATION_NOT_TRACKED: 's3:Replication:OperationNotTracked',
} as const;

/**
 * Common S3 storage classes
 */
export const S3_STORAGE_CLASSES = {
  STANDARD: 'STANDARD',
  STANDARD_IA: 'STANDARD_IA',
  ONEZONE_IA: 'ONEZONE_IA',
  REDUCED_REDUNDANCY: 'REDUCED_REDUNDANCY',
  GLACIER: 'GLACIER',
  GLACIER_IR: 'GLACIER_IR',
  DEEP_ARCHIVE: 'DEEP_ARCHIVE',
  INTELLIGENT_TIERING: 'INTELLIGENT_TIERING',
} as const;

/**
 * Recommended CORS configuration for web applications
 */
export const S3_CORS_WEB_DEFAULTS = {
  allowedHeaders: ['*'],
  allowedMethods: ['GET', 'HEAD'],
  allowedOrigins: ['*'],
  maxAgeSeconds: 3600,
} as const;

/**
 * Secure CORS configuration for API access
 */
export const S3_CORS_API_DEFAULTS = {
  allowedHeaders: ['Content-Type', 'Authorization'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
  exposeHeaders: ['ETag'],
  maxAgeSeconds: 86400,
} as const;

/**
 * Default bucket name generator
 * Creates a globally unique bucket name with secure prefix
 */
export function generateSecureBucketName(baseName: string): string {
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  // Create a secure, unique bucket name
  const fullName = `${baseName}-${timestamp}-${randomSuffix}`;

  // AWS bucket names must be 3-63 characters, lowercase, and follow DNS naming conventions
  return fullName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/\.+/g, '.')
    .replace(/-+/g, '-')
    .replace(/^[.-]|[.-]$/g, '')
    .substring(0, 63);
}

/**
 * Validates bucket name against AWS requirements
 */
export function validateBucketName(bucketName: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check length
  if (bucketName.length < 3 || bucketName.length > 63) {
    errors.push('Bucket name must be between 3 and 63 characters long');
  }

  // Check lowercase
  if (bucketName !== bucketName.toLowerCase()) {
    errors.push('Bucket name must be lowercase');
  }

  // Check for invalid characters
  if (!/^[a-z0-9.-]+$/.test(bucketName)) {
    errors.push('Bucket name can only contain lowercase letters, numbers, periods, and hyphens');
  }

  // Check for consecutive periods
  if (/\.\./.test(bucketName)) {
    errors.push('Bucket name cannot contain consecutive periods');
  }

  // Check for starting/ending with period or hyphen
  if (/^[.-]|[.-]$/.test(bucketName)) {
    errors.push('Bucket name cannot start or end with a period or hyphen');
  }

  // Check for IP address format
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(bucketName)) {
    errors.push('Bucket name cannot be formatted as an IP address');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a comprehensive bucket policy for common use cases
 */
export function createSecureBucketPolicy(
  bucketName: string,
  options: {
    allowCloudFront?: boolean;
    allowedPrincipals?: string[];
    denyInsecureTransport?: boolean;
    enforceSSL?: boolean;
  } = {}
): string {
  const {
    allowCloudFront = false,
    allowedPrincipals = [],
    denyInsecureTransport = true,
    enforceSSL = true,
  } = options;

  const statements: any[] = [];

  // Deny insecure transport
  if (denyInsecureTransport) {
    statements.push({
      Sid: 'DenyInsecureTransport',
      Effect: 'Deny',
      Principal: '*',
      Action: 's3:*',
      Resource: [`arn:aws:s3:::${bucketName}`, `arn:aws:s3:::${bucketName}/*`],
      Condition: {
        Bool: {
          'aws:SecureTransport': 'false',
        },
      },
    });
  }

  // Enforce SSL
  if (enforceSSL) {
    statements.push({
      Sid: 'DenyUnencryptedObjectUploads',
      Effect: 'Deny',
      Principal: '*',
      Action: 's3:PutObject',
      Resource: `arn:aws:s3:::${bucketName}/*`,
      Condition: {
        StringNotEquals: {
          's3:x-amz-server-side-encryption': 'AES256',
        },
      },
    });
  }

  // Allow CloudFront access
  if (allowCloudFront) {
    statements.push({
      Sid: 'AllowCloudFrontAccess',
      Effect: 'Allow',
      Principal: {
        Service: 'cloudfront.amazonaws.com',
      },
      Action: 's3:GetObject',
      Resource: `arn:aws:s3:::${bucketName}/*`,
    });
  }

  // Allow specific principals
  if (allowedPrincipals.length > 0) {
    statements.push({
      Sid: 'AllowSpecificPrincipals',
      Effect: 'Allow',
      Principal: {
        AWS: allowedPrincipals,
      },
      Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
      Resource: `arn:aws:s3:::${bucketName}/*`,
    });
  }

  return JSON.stringify(
    {
      Version: '2012-10-17',
      Statement: statements,
    },
    null,
    2
  );
}

/**
 * All S3 defaults consolidated
 */
export const S3_DEFAULTS = {
  encryption: S3_ENCRYPTION_DEFAULTS,
  versioning: S3_VERSIONING_DEFAULTS,
  publicAccessBlock: S3_PUBLIC_ACCESS_BLOCK_DEFAULTS,
  objectOwnership: S3_OBJECT_OWNERSHIP_DEFAULTS,
  lifecycle: S3_LIFECYCLE_DEFAULTS,
  website: S3_WEBSITE_DEFAULTS,
  requestPayer: S3_REQUEST_PAYER_DEFAULTS,
  tags: S3_DEFAULT_TAGS,
  events: S3_COMMON_EVENTS,
  storageClasses: S3_STORAGE_CLASSES,
  corsWeb: S3_CORS_WEB_DEFAULTS,
  corsApi: S3_CORS_API_DEFAULTS,
} as const;
