/**
 * Type definitions for the S3 module
 */

import { Input } from '@pulumi/pulumi';

/**
 * S3 bucket versioning configuration
 */
export interface S3VersioningConfig {
  /**
   * Whether to enable versioning
   * @default true
   */
  readonly enabled?: Input<boolean>;

  /**
   * Whether to enable MFA delete
   * @default false
   */
  readonly mfaDelete?: Input<boolean>;
}

/**
 * S3 bucket encryption configuration
 */
export interface S3EncryptionConfig {
  /**
   * The encryption algorithm to use
   * @default "AES256"
   */
  readonly sseAlgorithm?: Input<string>;

  /**
   * The KMS key ID to use for encryption (if using KMS)
   * If not specified, uses the default S3 service key
   */
  readonly kmsKeyId?: Input<string>;

  /**
   * Whether to enable bucket key for KMS encryption
   * @default true
   */
  readonly bucketKeyEnabled?: Input<boolean>;
}

/**
 * S3 bucket lifecycle rule configuration
 */
export interface S3LifecycleRule {
  /**
   * Unique identifier for the rule
   */
  readonly id: string;

  /**
   * Whether the rule is enabled
   * @default true
   */
  readonly enabled?: Input<boolean>;

  /**
   * Object key prefix to which the rule applies
   */
  readonly prefix?: Input<string>;

  /**
   * Tags to which the rule applies
   */
  readonly tags?: Input<Record<string, Input<string>>>;

  /**
   * Transition rules for different storage classes
   */
  readonly transitions?: readonly S3TransitionRule[];

  /**
   * Expiration settings
   */
  readonly expiration?: S3ExpirationRule;

  /**
   * Settings for incomplete multipart uploads
   */
  readonly abortIncompleteMultipartUpload?: S3AbortIncompleteMultipartUploadRule;

  /**
   * Settings for non-current version expiration
   */
  readonly noncurrentVersionExpiration?: S3NoncurrentVersionExpirationRule;

  /**
   * Settings for non-current version transitions
   */
  readonly noncurrentVersionTransitions?: readonly S3NoncurrentVersionTransitionRule[];
}

/**
 * S3 storage class transition rule
 */
export interface S3TransitionRule {
  /**
   * Number of days after creation when objects transition
   */
  readonly days?: Input<number>;

  /**
   * Date when objects transition
   */
  readonly date?: Input<string>;

  /**
   * The storage class to transition to
   */
  readonly storageClass: Input<string>;
}

/**
 * S3 object expiration rule
 */
export interface S3ExpirationRule {
  /**
   * Number of days after creation when objects expire
   */
  readonly days?: Input<number>;

  /**
   * Date when objects expire
   */
  readonly date?: Input<string>;

  /**
   * Whether to delete expired object delete markers
   * @default false
   */
  readonly expiredObjectDeleteMarker?: Input<boolean>;
}

/**
 * S3 abort incomplete multipart upload rule
 */
export interface S3AbortIncompleteMultipartUploadRule {
  /**
   * Number of days after initiation when incomplete multipart uploads are aborted
   */
  readonly daysAfterInitiation: Input<number>;
}

/**
 * S3 non-current version expiration rule
 */
export interface S3NoncurrentVersionExpirationRule {
  /**
   * Number of days after becoming non-current when versions expire
   */
  readonly noncurrentDays: Input<number>;
}

/**
 * S3 non-current version transition rule
 */
export interface S3NoncurrentVersionTransitionRule {
  /**
   * Number of days after becoming non-current when versions transition
   */
  readonly noncurrentDays: Input<number>;

  /**
   * The storage class to transition to
   */
  readonly storageClass: Input<string>;
}

/**
 * S3 bucket notification configuration
 */
export interface S3NotificationConfig {
  /**
   * Lambda function notifications
   */
  readonly lambdaFunctions?: readonly S3LambdaFunctionConfig[];

  /**
   * SNS topic notifications
   */
  readonly topics?: readonly S3TopicConfig[];

  /**
   * SQS queue notifications
   */
  readonly queues?: readonly S3QueueConfig[];
}

/**
 * S3 Lambda function notification configuration
 */
export interface S3LambdaFunctionConfig {
  /**
   * The Lambda function ARN
   */
  readonly lambdaFunctionArn: Input<string>;

  /**
   * The S3 events to trigger on
   */
  readonly events: readonly Input<string>[];

  /**
   * Object key prefix filter
   */
  readonly filterPrefix?: Input<string>;

  /**
   * Object key suffix filter
   */
  readonly filterSuffix?: Input<string>;
}

/**
 * S3 SNS topic notification configuration
 */
export interface S3TopicConfig {
  /**
   * The SNS topic ARN
   */
  readonly topicArn: Input<string>;

  /**
   * The S3 events to trigger on
   */
  readonly events: readonly Input<string>[];

  /**
   * Object key prefix filter
   */
  readonly filterPrefix?: Input<string>;

  /**
   * Object key suffix filter
   */
  readonly filterSuffix?: Input<string>;
}

/**
 * S3 SQS queue notification configuration
 */
export interface S3QueueConfig {
  /**
   * The SQS queue ARN
   */
  readonly queueArn: Input<string>;

  /**
   * The S3 events to trigger on
   */
  readonly events: readonly Input<string>[];

  /**
   * Object key prefix filter
   */
  readonly filterPrefix?: Input<string>;

  /**
   * Object key suffix filter
   */
  readonly filterSuffix?: Input<string>;
}

/**
 * S3 bucket logging configuration
 */
export interface S3LoggingConfig {
  /**
   * The name of the bucket where access logs are stored
   */
  readonly targetBucket: Input<string>;

  /**
   * The prefix for the access log objects
   */
  readonly targetPrefix?: Input<string>;
}

/**
 * S3 bucket CORS configuration
 */
export interface S3CorsRule {
  /**
   * Headers that are specified in the Access-Control-Request-Headers header
   */
  readonly allowedHeaders?: readonly Input<string>[];

  /**
   * HTTP methods that the origin is allowed to execute
   */
  readonly allowedMethods: readonly Input<string>[];

  /**
   * Origins that are allowed to access the bucket
   */
  readonly allowedOrigins: readonly Input<string>[];

  /**
   * Headers in the response that the client is able to access
   */
  readonly exposeHeaders?: readonly Input<string>[];

  /**
   * Unique identifier for the rule
   */
  readonly id?: Input<string>;

  /**
   * The time in seconds that the browser can cache the response
   */
  readonly maxAgeSeconds?: Input<number>;
}

/**
 * Configuration options for the S3 component
 */
export interface S3Args {
  /**
   * The name of the S3 bucket
   * Must be globally unique across all AWS accounts
   */
  readonly name: string;

  /**
   * Whether to force destroy the bucket even if it contains objects
   * @default false
   */
  readonly forceDestroy?: Input<boolean>;

  /**
   * Object ownership settings
   * @default "BucketOwnerPreferred"
   */
  readonly objectOwnership?: Input<string>;

  /**
   * Bucket versioning configuration
   * @default { enabled: true }
   */
  readonly versioning?: S3VersioningConfig;

  /**
   * Bucket encryption configuration
   * @default { sseAlgorithm: "AES256" }
   */
  readonly encryption?: S3EncryptionConfig;

  /**
   * Lifecycle rules for the bucket
   * @default []
   */
  readonly lifecycleRules?: readonly S3LifecycleRule[];

  /**
   * Bucket notification configuration
   */
  readonly notification?: S3NotificationConfig;

  /**
   * Bucket logging configuration
   */
  readonly logging?: S3LoggingConfig;

  /**
   * CORS configuration
   */
  readonly corsRules?: readonly S3CorsRule[];

  /**
   * Whether to enable transfer acceleration
   * @default false
   */
  readonly accelerationStatus?: Input<string>;

  /**
   * Whether to enable request payer
   * @default "BucketOwner"
   */
  readonly requestPayer?: Input<string>;

  /**
   * Custom tags to apply to all resources
   */
  readonly tags?: Input<Record<string, Input<string>>>;

  /**
   * Whether to block public ACLs
   * @default true
   */
  readonly blockPublicAcls?: Input<boolean>;

  /**
   * Whether to block public policy
   * @default true
   */
  readonly blockPublicPolicy?: Input<boolean>;

  /**
   * Whether to ignore public ACLs
   * @default true
   */
  readonly ignorePublicAcls?: Input<boolean>;

  /**
   * Whether to restrict public buckets
   * @default true
   */
  readonly restrictPublicBuckets?: Input<boolean>;

  /**
   * Custom bucket policy JSON
   */
  readonly policy?: Input<string>;

  /**
   * Website configuration for static website hosting
   */
  readonly website?: S3WebsiteConfig;
}

/**
 * S3 website configuration
 */
export interface S3WebsiteConfig {
  /**
   * The name of the index document
   * @default "index.html"
   */
  readonly indexDocument?: Input<string>;

  /**
   * The name of the error document
   * @default "error.html"
   */
  readonly errorDocument?: Input<string>;

  /**
   * The redirect all requests to another host name
   */
  readonly redirectAllRequestsTo?: Input<string>;

  /**
   * Routing rules for the website
   */
  readonly routingRules?: Input<string>;
}

/**
 * Output properties of the S3 component
 */
export interface S3Outputs {
  /**
   * The S3 bucket resource
   */
  readonly bucket: import('@pulumi/aws').s3.Bucket;

  /**
   * The S3 bucket public access block
   */
  readonly publicAccessBlock: import('@pulumi/aws').s3.BucketPublicAccessBlock;

  /**
   * The S3 bucket encryption resource
   */
  readonly encryption: import('@pulumi/aws').s3.BucketServerSideEncryptionConfigurationV2;

  /**
   * The S3 bucket versioning resource
   */
  readonly versioning: import('@pulumi/aws').s3.BucketVersioningV2;

  /**
   * The S3 bucket lifecycle configuration
   */
  readonly lifecycle?: import('@pulumi/aws').s3.BucketLifecycleConfigurationV2;

  /**
   * The S3 bucket notification resource
   */
  readonly notification?: import('@pulumi/aws').s3.BucketNotification;

  /**
   * The S3 bucket logging resource
   */
  readonly logging?: import('@pulumi/aws').s3.BucketLoggingV2;

  /**
   * The S3 bucket CORS configuration
   */
  readonly cors?: import('@pulumi/aws').s3.BucketCorsConfigurationV2;

  /**
   * The S3 bucket policy resource
   */
  readonly bucketPolicy?: import('@pulumi/aws').s3.BucketPolicy;

  /**
   * The S3 bucket website configuration
   */
  readonly website?: import('@pulumi/aws').s3.BucketWebsiteConfigurationV2;

  /**
   * The bucket name
   */
  readonly bucketName: import('@pulumi/pulumi').Output<string>;

  /**
   * The bucket ARN
   */
  readonly bucketArn: import('@pulumi/pulumi').Output<string>;

  /**
   * The bucket domain name
   */
  readonly bucketDomainName: import('@pulumi/pulumi').Output<string>;

  /**
   * The bucket regional domain name
   */
  readonly bucketRegionalDomainName: import('@pulumi/pulumi').Output<string>;

  /**
   * The bucket website endpoint (if website is enabled)
   */
  readonly websiteEndpoint?: import('@pulumi/pulumi').Output<string>;

  /**
   * The bucket website domain (if website is enabled)
   */
  readonly websiteDomain?: import('@pulumi/pulumi').Output<string>;
}
