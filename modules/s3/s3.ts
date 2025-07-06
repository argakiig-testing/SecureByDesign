/**
 * S3 Component - Secure object storage
 *
 * Provides a secure, production-ready S3 bucket with:
 * - Encryption at rest by default
 * - Versioning enabled
 * - Public access blocked
 * - Lifecycle management
 * - Proper tagging and monitoring
 */

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi';

import { S3Args, S3Outputs } from './types';
import { S3_DEFAULTS, validateBucketName, createSecureBucketPolicy } from './defaults';

/**
 * S3 Component for secure object storage
 */
export class S3Component extends ComponentResource implements S3Outputs {
  private readonly componentName: string;
  public readonly bucket: aws.s3.Bucket;
  public readonly publicAccessBlock: aws.s3.BucketPublicAccessBlock;
  public readonly encryption: aws.s3.BucketServerSideEncryptionConfigurationV2;
  public readonly versioning: aws.s3.BucketVersioningV2;
  public readonly lifecycle?: aws.s3.BucketLifecycleConfigurationV2;
  public readonly notification?: aws.s3.BucketNotification;
  public readonly logging?: aws.s3.BucketLoggingV2;
  public readonly cors?: aws.s3.BucketCorsConfigurationV2;
  public readonly bucketPolicy?: aws.s3.BucketPolicy;
  public readonly website?: aws.s3.BucketWebsiteConfigurationV2;

  // Computed outputs
  public readonly bucketName: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;
  public readonly bucketDomainName: pulumi.Output<string>;
  public readonly bucketRegionalDomainName: pulumi.Output<string>;
  public readonly websiteEndpoint?: pulumi.Output<string>;
  public readonly websiteDomain?: pulumi.Output<string>;

  constructor(name: string, args: S3Args, opts?: ComponentResourceOptions) {
    super('modinfra:s3:S3Component', name, args, opts);

    this.componentName = name;

    // Validate bucket name
    const bucketName = args.name;
    const validation = validateBucketName(bucketName);
    if (!validation.isValid) {
      throw new Error(`Invalid bucket name: ${validation.errors.join(', ')}`);
    }

    // Merge tags with defaults
    const tags = pulumi.all([args.tags || {}]).apply(([userTags]) => ({
      ...S3_DEFAULTS.tags,
      ...userTags,
      Name: bucketName,
    }));

    // Create the S3 bucket
    this.bucket = new aws.s3.Bucket(
      `${name}-bucket`,
      {
        bucket: bucketName,
        forceDestroy: args.forceDestroy || false,
        tags,
      },
      { parent: this }
    );

    // Configure object ownership
    const objectOwnership = new aws.s3.BucketOwnershipControls(
      `${name}-ownership`,
      {
        bucket: this.bucket.id,
        rule: {
          objectOwnership: args.objectOwnership || S3_DEFAULTS.objectOwnership.objectOwnership,
        },
      },
      { parent: this }
    );

    // Block public access
    this.publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `${name}-public-access-block`,
      {
        bucket: this.bucket.id,
        blockPublicAcls:
          args.blockPublicAcls !== undefined
            ? args.blockPublicAcls
            : S3_DEFAULTS.publicAccessBlock.blockPublicAcls,
        blockPublicPolicy:
          args.blockPublicPolicy !== undefined
            ? args.blockPublicPolicy
            : S3_DEFAULTS.publicAccessBlock.blockPublicPolicy,
        ignorePublicAcls:
          args.ignorePublicAcls !== undefined
            ? args.ignorePublicAcls
            : S3_DEFAULTS.publicAccessBlock.ignorePublicAcls,
        restrictPublicBuckets:
          args.restrictPublicBuckets !== undefined
            ? args.restrictPublicBuckets
            : S3_DEFAULTS.publicAccessBlock.restrictPublicBuckets,
      },
      { parent: this, dependsOn: [objectOwnership] }
    );

    // Configure encryption
    const encryptionConfig = args.encryption || S3_DEFAULTS.encryption;
    this.encryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `${name}-encryption`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: encryptionConfig.sseAlgorithm || 'AES256',
              ...('kmsKeyId' in encryptionConfig &&
                encryptionConfig.kmsKeyId && { kmsMasterKeyId: encryptionConfig.kmsKeyId }),
            },
            ...(encryptionConfig.bucketKeyEnabled !== undefined && {
              bucketKeyEnabled: encryptionConfig.bucketKeyEnabled,
            }),
          },
        ],
      },
      { parent: this }
    );

    // Configure versioning
    const versioningConfig = args.versioning || S3_DEFAULTS.versioning;
    this.versioning = new aws.s3.BucketVersioningV2(
      `${name}-versioning`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: versioningConfig.enabled ? 'Enabled' : 'Suspended',
          mfaDelete: versioningConfig.mfaDelete ? 'Enabled' : 'Disabled',
        },
      },
      { parent: this }
    );

    // Configure lifecycle rules
    const lifecycleRules = args.lifecycleRules || S3_DEFAULTS.lifecycle;
    if (lifecycleRules.length > 0) {
      this.lifecycle = new aws.s3.BucketLifecycleConfigurationV2(
        `${name}-lifecycle`,
        {
          bucket: this.bucket.id,
          rules: lifecycleRules.map(rule => ({
            id: rule.id,
            status: rule.enabled === false ? 'Disabled' : 'Enabled',
            ...((rule.prefix || rule.tags) && {
              filter: {
                ...(rule.prefix && { prefix: rule.prefix }),
                ...(rule.tags && { tags: rule.tags }),
              },
            }),
            ...(rule.transitions && {
              transitions: rule.transitions.map(t => ({
                ...(t.days !== undefined && { days: t.days }),
                ...(t.date !== undefined && { date: t.date }),
                storageClass: t.storageClass,
              })),
            }),
            ...(rule.expiration && {
              expiration: {
                ...(rule.expiration.days !== undefined && { days: rule.expiration.days }),
                ...(rule.expiration.date !== undefined && { date: rule.expiration.date }),
                ...(rule.expiration.expiredObjectDeleteMarker !== undefined && {
                  expiredObjectDeleteMarker: rule.expiration.expiredObjectDeleteMarker,
                }),
              },
            }),
            ...(rule.abortIncompleteMultipartUpload && {
              abortIncompleteMultipartUpload: {
                daysAfterInitiation: rule.abortIncompleteMultipartUpload.daysAfterInitiation,
              },
            }),
            ...(rule.noncurrentVersionExpiration && {
              noncurrentVersionExpiration: {
                noncurrentDays: rule.noncurrentVersionExpiration.noncurrentDays,
              },
            }),
            ...(rule.noncurrentVersionTransitions && {
              noncurrentVersionTransitions: rule.noncurrentVersionTransitions.map(t => ({
                noncurrentDays: t.noncurrentDays,
                storageClass: t.storageClass,
              })),
            }),
          })),
        },
        { parent: this }
      );
    }

    // Configure logging
    if (args.logging) {
      this.logging = new aws.s3.BucketLoggingV2(
        `${name}-logging`,
        {
          bucket: this.bucket.id,
          targetBucket: args.logging.targetBucket,
          targetPrefix: args.logging.targetPrefix || '',
        },
        { parent: this }
      );
    }

    // Configure CORS
    if (args.corsRules && args.corsRules.length > 0) {
      this.cors = new aws.s3.BucketCorsConfigurationV2(
        `${name}-cors`,
        {
          bucket: this.bucket.id,
          corsRules: args.corsRules.map(rule => ({
            ...(rule.id !== undefined && { id: rule.id }),
            ...(rule.allowedHeaders !== undefined && {
              allowedHeaders: rule.allowedHeaders as pulumi.Input<string>[],
            }),
            allowedMethods: rule.allowedMethods as pulumi.Input<string>[],
            allowedOrigins: rule.allowedOrigins as pulumi.Input<string>[],
            ...(rule.exposeHeaders !== undefined && {
              exposeHeaders: rule.exposeHeaders as pulumi.Input<string>[],
            }),
            ...(rule.maxAgeSeconds !== undefined && { maxAgeSeconds: rule.maxAgeSeconds }),
          })),
        },
        { parent: this }
      );
    }

    // Configure website hosting
    if (args.website) {
      this.website = new aws.s3.BucketWebsiteConfigurationV2(
        `${name}-website`,
        {
          bucket: this.bucket.id,
          indexDocument: {
            suffix: args.website.indexDocument || S3_DEFAULTS.website.indexDocument,
          },
          errorDocument: {
            key: args.website.errorDocument || S3_DEFAULTS.website.errorDocument,
          },
          ...(args.website.redirectAllRequestsTo && {
            redirectAllRequestsTo: {
              hostName: args.website.redirectAllRequestsTo,
            },
          }),
        },
        { parent: this }
      );
    }

    // Configure bucket policy
    if (args.policy) {
      this.bucketPolicy = new aws.s3.BucketPolicy(
        `${name}-policy`,
        {
          bucket: this.bucket.id,
          policy: args.policy,
        },
        { parent: this, dependsOn: [this.publicAccessBlock] }
      );
    }

    // Configure notifications
    if (args.notification) {
      this.notification = new aws.s3.BucketNotification(
        `${name}-notification`,
        {
          bucket: this.bucket.id,
          ...(args.notification.lambdaFunctions && {
            lambdaFunctions: args.notification.lambdaFunctions.map(lambda => ({
              lambdaFunctionArn: lambda.lambdaFunctionArn,
              events: lambda.events as pulumi.Input<string>[],
              ...(lambda.filterPrefix !== undefined && { filterPrefix: lambda.filterPrefix }),
              ...(lambda.filterSuffix !== undefined && { filterSuffix: lambda.filterSuffix }),
            })),
          }),
          ...(args.notification.topics && {
            topics: args.notification.topics.map(topic => ({
              topicArn: topic.topicArn,
              events: topic.events as pulumi.Input<string>[],
              ...(topic.filterPrefix !== undefined && { filterPrefix: topic.filterPrefix }),
              ...(topic.filterSuffix !== undefined && { filterSuffix: topic.filterSuffix }),
            })),
          }),
          ...(args.notification.queues && {
            queues: args.notification.queues.map(queue => ({
              queueArn: queue.queueArn,
              events: queue.events as pulumi.Input<string>[],
              ...(queue.filterPrefix !== undefined && { filterPrefix: queue.filterPrefix }),
              ...(queue.filterSuffix !== undefined && { filterSuffix: queue.filterSuffix }),
            })),
          }),
        },
        { parent: this }
      );
    }

    // Configure acceleration
    if (args.accelerationStatus) {
      new aws.s3.BucketAccelerateConfigurationV2(
        `${name}-acceleration`,
        {
          bucket: this.bucket.id,
          status: args.accelerationStatus,
        },
        { parent: this }
      );
    }

    // Configure request payer
    if (args.requestPayer) {
      new aws.s3.BucketRequestPaymentConfigurationV2(
        `${name}-request-payer`,
        {
          bucket: this.bucket.id,
          payer: args.requestPayer,
        },
        { parent: this }
      );
    }

    // Set computed outputs
    this.bucketName = this.bucket.id;
    this.bucketArn = this.bucket.arn;
    this.bucketDomainName = this.bucket.bucketDomainName;
    this.bucketRegionalDomainName = this.bucket.bucketRegionalDomainName;

    if (this.website) {
      this.websiteEndpoint = this.website.websiteEndpoint;
      this.websiteDomain = this.website.websiteDomain;
    }

    // Register outputs
    this.registerOutputs({
      bucket: this.bucket,
      publicAccessBlock: this.publicAccessBlock,
      encryption: this.encryption,
      versioning: this.versioning,
      lifecycle: this.lifecycle,
      notification: this.notification,
      logging: this.logging,
      cors: this.cors,
      bucketPolicy: this.bucketPolicy,
      website: this.website,
      bucketName: this.bucketName,
      bucketArn: this.bucketArn,
      bucketDomainName: this.bucketDomainName,
      bucketRegionalDomainName: this.bucketRegionalDomainName,
      websiteEndpoint: this.websiteEndpoint,
      websiteDomain: this.websiteDomain,
    });
  }

  /**
   * Creates a secure bucket policy for the bucket
   */
  public createSecurePolicy(
    options: {
      allowCloudFront?: boolean;
      allowedPrincipals?: string[];
      denyInsecureTransport?: boolean;
      enforceSSL?: boolean;
    } = {}
  ): aws.s3.BucketPolicy {
    const policy = this.bucketName.apply(name => createSecureBucketPolicy(name, options));

    return new aws.s3.BucketPolicy(
      `${this.componentName}-secure-policy`,
      {
        bucket: this.bucket.id,
        policy,
      },
      { parent: this, dependsOn: [this.publicAccessBlock] }
    );
  }

  /**
   * Adds a lifecycle rule to the bucket
   */
  public addLifecycleRule(_rule: {
    id: string;
    enabled?: boolean;
    prefix?: string;
    tags?: Record<string, string>;
    transitions?: Array<{
      days?: number;
      date?: string;
      storageClass: string;
    }>;
    expiration?: {
      days?: number;
      date?: string;
      expiredObjectDeleteMarker?: boolean;
    };
  }): void {
    // This would typically be implemented by updating the lifecycle configuration
    // For now, we'll throw an error suggesting the user configure this at creation time
    throw new Error(
      'Lifecycle rules should be configured at bucket creation time. Please recreate the bucket with the desired lifecycle rules.'
    );
  }

  /**
   * Grants read access to the bucket
   */
  public grantReadAccess(principalArn: string): aws.s3.BucketPolicy {
    const policy = this.bucketArn.apply(arn =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'GrantReadAccess',
            Effect: 'Allow',
            Principal: {
              AWS: principalArn,
            },
            Action: ['s3:GetObject', 's3:GetObjectVersion', 's3:ListBucket'],
            Resource: [arn, `${arn}/*`],
          },
        ],
      })
    );

    return new aws.s3.BucketPolicy(
      `${this.componentName}-read-policy`,
      {
        bucket: this.bucket.id,
        policy,
      },
      { parent: this, dependsOn: [this.publicAccessBlock] }
    );
  }

  /**
   * Grants write access to the bucket
   */
  public grantWriteAccess(principalArn: string): aws.s3.BucketPolicy {
    const policy = this.bucketArn.apply(arn =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'GrantWriteAccess',
            Effect: 'Allow',
            Principal: {
              AWS: principalArn,
            },
            Action: [
              's3:PutObject',
              's3:PutObjectAcl',
              's3:DeleteObject',
              's3:DeleteObjectVersion',
            ],
            Resource: `${arn}/*`,
          },
        ],
      })
    );

    return new aws.s3.BucketPolicy(
      `${this.componentName}-write-policy`,
      {
        bucket: this.bucket.id,
        policy,
      },
      { parent: this, dependsOn: [this.publicAccessBlock] }
    );
  }

  /**
   * Grants full access to the bucket
   */
  public grantFullAccess(principalArn: string): aws.s3.BucketPolicy {
    const policy = this.bucketArn.apply(arn =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'GrantFullAccess',
            Effect: 'Allow',
            Principal: {
              AWS: principalArn,
            },
            Action: 's3:*',
            Resource: [arn, `${arn}/*`],
          },
        ],
      })
    );

    return new aws.s3.BucketPolicy(
      `${this.componentName}-full-policy`,
      {
        bucket: this.bucket.id,
        policy,
      },
      { parent: this, dependsOn: [this.publicAccessBlock] }
    );
  }
}
