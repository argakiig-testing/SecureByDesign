/**
 * S3 Module - Secure object storage
 *
 * Provides a secure, production-ready S3 bucket with:
 * - Encryption at rest by default (AES256)
 * - Versioning enabled for data protection
 * - Public access blocked by default
 * - Lifecycle management for cost optimization
 * - Comprehensive security policies
 * - Proper tagging and monitoring
 *
 * @example
 * ```typescript
 * import { S3Component } from '@modinfra/s3';
 *
 * // Basic secure bucket
 * const bucket = new S3Component('documents', {
 *   name: 'my-company-documents',
 * });
 *
 * // Bucket with custom lifecycle rules
 * const dataBucket = new S3Component('data', {
 *   name: 'my-company-data',
 *   lifecycleRules: [
 *     {
 *       id: 'archive-old-data',
 *       enabled: true,
 *       transitions: [
 *         {
 *           days: 30,
 *           storageClass: 'STANDARD_IA',
 *         },
 *         {
 *           days: 90,
 *           storageClass: 'GLACIER',
 *         },
 *       ],
 *     },
 *   ],
 * });
 *
 * // Static website hosting
 * const websiteBucket = new S3Component('website', {
 *   name: 'my-company-website',
 *   website: {
 *     indexDocument: 'index.html',
 *     errorDocument: 'error.html',
 *   },
 *   corsRules: [
 *     {
 *       allowedMethods: ['GET', 'HEAD'],
 *       allowedOrigins: ['*'],
 *       allowedHeaders: ['*'],
 *       maxAgeSeconds: 3600,
 *     },
 *   ],
 * });
 * ```
 */

// Export the main S3 component
export { S3Component } from './s3';

// Export types for consumers
export type {
  S3Args,
  S3Outputs,
  S3VersioningConfig,
  S3EncryptionConfig,
  S3LifecycleRule,
  S3TransitionRule,
  S3ExpirationRule,
  S3AbortIncompleteMultipartUploadRule,
  S3NoncurrentVersionExpirationRule,
  S3NoncurrentVersionTransitionRule,
  S3NotificationConfig,
  S3LambdaFunctionConfig,
  S3TopicConfig,
  S3QueueConfig,
  S3LoggingConfig,
  S3CorsRule,
  S3WebsiteConfig,
} from './types';

// Export defaults and utilities for advanced users
export {
  S3_DEFAULTS,
  S3_ENCRYPTION_DEFAULTS,
  S3_VERSIONING_DEFAULTS,
  S3_PUBLIC_ACCESS_BLOCK_DEFAULTS,
  S3_OBJECT_OWNERSHIP_DEFAULTS,
  S3_LIFECYCLE_DEFAULTS,
  S3_WEBSITE_DEFAULTS,
  S3_REQUEST_PAYER_DEFAULTS,
  S3_DEFAULT_TAGS,
  S3_COMMON_EVENTS,
  S3_STORAGE_CLASSES,
  S3_CORS_WEB_DEFAULTS,
  S3_CORS_API_DEFAULTS,
  generateSecureBucketName,
  validateBucketName,
  createSecureBucketPolicy,
} from './defaults';

// Convenience re-export for common use case
export { S3Component as S3 } from './s3';
