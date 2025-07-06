/**
 * Unit tests for S3 module
 * Fast, isolated tests using mocks
 */

import { S3Component } from '../s3';
import {
  validateBucketName,
  generateSecureBucketName,
  createSecureBucketPolicy,
} from '../defaults';
import { S3_DEFAULTS } from '../defaults';

// Mock Pulumi AWS
jest.mock('@pulumi/aws', () => ({
  s3: {
    Bucket: jest.fn().mockImplementation(() => ({
      id: { apply: jest.fn(fn => fn('test-bucket')) },
      arn: { apply: jest.fn(fn => fn('arn:aws:s3:::test-bucket')) },
      bucketDomainName: { apply: jest.fn(fn => fn('test-bucket.s3.amazonaws.com')) },
      bucketRegionalDomainName: {
        apply: jest.fn(fn => fn('test-bucket.s3.us-east-1.amazonaws.com')),
      },
    })),
    BucketOwnershipControls: jest.fn(),
    BucketPublicAccessBlock: jest.fn(),
    BucketServerSideEncryptionConfigurationV2: jest.fn(),
    BucketVersioningV2: jest.fn(),
    BucketLifecycleConfigurationV2: jest.fn(),
    BucketLoggingV2: jest.fn(),
    BucketCorsConfigurationV2: jest.fn(),
    BucketWebsiteConfigurationV2: jest.fn().mockImplementation(() => ({
      websiteEndpoint: {
        apply: jest.fn(fn => fn('test-bucket.s3-website.us-east-1.amazonaws.com')),
      },
      websiteDomain: { apply: jest.fn(fn => fn('test-bucket.s3-website.us-east-1.amazonaws.com')) },
    })),
    BucketPolicy: jest.fn(),
    BucketNotification: jest.fn(),
    BucketAccelerateConfigurationV2: jest.fn(),
    BucketRequestPaymentConfigurationV2: jest.fn(),
  },
}));

// Mock Pulumi core
jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: class MockComponentResource {
    registerOutputs = jest.fn();
  },
  all: jest.fn(args => ({ apply: jest.fn(fn => fn(args)) })),
  interpolate: jest.fn(template => template),
  Output: {
    create: jest.fn(value => ({
      apply: jest.fn(fn => fn(value)),
    })),
  },
}));

describe('S3Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create a basic S3 bucket with secure defaults', () => {
      const bucket = new S3Component('test', {
        name: 'test-bucket',
      });

      expect(bucket).toBeDefined();
      expect(bucket.bucket).toBeDefined();
      expect(bucket.publicAccessBlock).toBeDefined();
      expect(bucket.encryption).toBeDefined();
      expect(bucket.versioning).toBeDefined();
    });

    it('should validate bucket name on creation', () => {
      expect(() => {
        new S3Component('test', {
          name: 'INVALID-BUCKET-NAME',
        });
      }).toThrow('Invalid bucket name');
    });

    it('should accept custom encryption settings', () => {
      const bucket = new S3Component('test', {
        name: 'test-bucket',
        encryption: {
          sseAlgorithm: 'aws:kms',
          kmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        },
      });

      expect(bucket).toBeDefined();
      expect(bucket.encryption).toBeDefined();
    });

    it('should accept custom versioning settings', () => {
      const bucket = new S3Component('test', {
        name: 'test-bucket',
        versioning: {
          enabled: false,
          mfaDelete: true,
        },
      });

      expect(bucket).toBeDefined();
      expect(bucket.versioning).toBeDefined();
    });

    it('should accept custom lifecycle rules', () => {
      const bucket = new S3Component('test', {
        name: 'test-bucket',
        lifecycleRules: [
          {
            id: 'test-rule',
            enabled: true,
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
            ],
          },
        ],
      });

      expect(bucket).toBeDefined();
      expect(bucket.lifecycle).toBeDefined();
    });

    it('should accept website configuration', () => {
      const bucket = new S3Component('test', {
        name: 'test-bucket',
        website: {
          indexDocument: 'index.html',
          errorDocument: 'error.html',
        },
      });

      expect(bucket).toBeDefined();
      expect(bucket.website).toBeDefined();
    });

    it('should accept CORS configuration', () => {
      const bucket = new S3Component('test', {
        name: 'test-bucket',
        corsRules: [
          {
            allowedMethods: ['GET', 'HEAD'],
            allowedOrigins: ['*'],
            allowedHeaders: ['*'],
            maxAgeSeconds: 3600,
          },
        ],
      });

      expect(bucket).toBeDefined();
      expect(bucket.cors).toBeDefined();
    });

    it('should accept custom tags', () => {
      const bucket = new S3Component('test', {
        name: 'test-bucket',
        tags: {
          Environment: 'test',
          Project: 'myproject',
        },
      });

      expect(bucket).toBeDefined();
    });

    it('should accept notification configuration', () => {
      const bucket = new S3Component('test', {
        name: 'test-bucket',
        notification: {
          lambdaFunctions: [
            {
              lambdaFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
              events: ['s3:ObjectCreated:*'],
            },
          ],
        },
      });

      expect(bucket).toBeDefined();
      expect(bucket.notification).toBeDefined();
    });

    it('should accept logging configuration', () => {
      const bucket = new S3Component('test', {
        name: 'test-bucket',
        logging: {
          targetBucket: 'access-logs-bucket',
          targetPrefix: 'logs/',
        },
      });

      expect(bucket).toBeDefined();
      expect(bucket.logging).toBeDefined();
    });

    it('should accept acceleration configuration', () => {
      const bucket = new S3Component('test', {
        name: 'test-bucket',
        accelerationStatus: 'Enabled',
      });

      expect(bucket).toBeDefined();
    });

    it('should accept request payer configuration', () => {
      const bucket = new S3Component('test', {
        name: 'test-bucket',
        requestPayer: 'Requester',
      });

      expect(bucket).toBeDefined();
    });

    it('should accept custom public access block settings', () => {
      const bucket = new S3Component('test', {
        name: 'test-bucket',
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      });

      expect(bucket).toBeDefined();
      expect(bucket.publicAccessBlock).toBeDefined();
    });

    it('should accept custom bucket policy', () => {
      const policy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: 'arn:aws:iam::123456789012:root' },
            Action: 's3:GetObject',
            Resource: 'arn:aws:s3:::test-bucket/*',
          },
        ],
      });

      const bucket = new S3Component('test', {
        name: 'test-bucket',
        policy,
      });

      expect(bucket).toBeDefined();
      expect(bucket.bucketPolicy).toBeDefined();
    });
  });

  describe('Public Methods', () => {
    let bucket: S3Component;

    beforeEach(() => {
      bucket = new S3Component('test', {
        name: 'test-bucket',
      });
    });

    it('should create a secure policy', () => {
      const policy = bucket.createSecurePolicy({
        allowCloudFront: true,
        denyInsecureTransport: true,
        enforceSSL: true,
      });

      expect(policy).toBeDefined();
    });

    it('should grant read access', () => {
      const policy = bucket.grantReadAccess('arn:aws:iam::123456789012:user/testuser');

      expect(policy).toBeDefined();
    });

    it('should grant write access', () => {
      const policy = bucket.grantWriteAccess('arn:aws:iam::123456789012:user/testuser');

      expect(policy).toBeDefined();
    });

    it('should grant full access', () => {
      const policy = bucket.grantFullAccess('arn:aws:iam::123456789012:user/testuser');

      expect(policy).toBeDefined();
    });

    it('should throw error when adding lifecycle rule after creation', () => {
      expect(() => {
        bucket.addLifecycleRule({
          id: 'test-rule',
          enabled: true,
        });
      }).toThrow('Lifecycle rules should be configured at bucket creation time');
    });
  });

  describe('Outputs', () => {
    it('should provide correct output properties', () => {
      const bucket = new S3Component('test', {
        name: 'test-bucket',
      });

      expect(bucket.bucketName).toBeDefined();
      expect(bucket.bucketArn).toBeDefined();
      expect(bucket.bucketDomainName).toBeDefined();
      expect(bucket.bucketRegionalDomainName).toBeDefined();
    });

    it('should provide website outputs when website is configured', () => {
      const bucket = new S3Component('test', {
        name: 'test-bucket',
        website: {
          indexDocument: 'index.html',
        },
      });

      expect(bucket.websiteEndpoint).toBeDefined();
      expect(bucket.websiteDomain).toBeDefined();
    });
  });
});

describe('Bucket Name Validation', () => {
  it('should validate correct bucket names', () => {
    const validNames = [
      'my-bucket',
      'my-bucket-123',
      'my.bucket',
      'my-bucket.with-dots',
      'a'.repeat(63), // Max length
    ];

    validNames.forEach(name => {
      const result = validateBucketName(name);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  it('should reject invalid bucket names', () => {
    const invalidNames = [
      'MY-BUCKET', // Uppercase
      'my_bucket', // Underscore
      'my-bucket-', // Ends with hyphen
      '.my-bucket', // Starts with period
      'my..bucket', // Consecutive periods
      'ab', // Too short
      'a'.repeat(64), // Too long
      '192.168.1.1', // IP address format
      'bucket space', // Space
      'bucket!', // Special character
    ];

    invalidNames.forEach(name => {
      const result = validateBucketName(name);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Secure Bucket Name Generation', () => {
  it('should generate valid bucket names', () => {
    const baseName = 'my-bucket';
    const generatedName = generateSecureBucketName(baseName);

    expect(generatedName).toMatch(/^[a-z0-9.-]+$/);
    expect(generatedName.length).toBeGreaterThanOrEqual(3);
    expect(generatedName.length).toBeLessThanOrEqual(63);
    expect(generatedName).toContain(baseName);

    const validation = validateBucketName(generatedName);
    expect(validation.isValid).toBe(true);
  });

  it('should generate unique bucket names', () => {
    const baseName = 'my-bucket';
    const name1 = generateSecureBucketName(baseName);
    const name2 = generateSecureBucketName(baseName);

    expect(name1).not.toBe(name2);
  });

  it('should handle long base names', () => {
    const baseName = 'a'.repeat(50);
    const generatedName = generateSecureBucketName(baseName);

    expect(generatedName.length).toBeLessThanOrEqual(63);
    const validation = validateBucketName(generatedName);
    expect(validation.isValid).toBe(true);
  });
});

describe('Secure Bucket Policy Creation', () => {
  it('should create a basic secure policy', () => {
    const bucketName = 'test-bucket';
    const policy = createSecureBucketPolicy(bucketName);

    expect(policy).toBeDefined();
    expect(typeof policy).toBe('string');

    const parsed = JSON.parse(policy);
    expect(parsed.Version).toBe('2012-10-17');
    expect(parsed.Statement).toBeInstanceOf(Array);
    expect(parsed.Statement.length).toBeGreaterThan(0);
  });

  it('should create policy with CloudFront access', () => {
    const bucketName = 'test-bucket';
    const policy = createSecureBucketPolicy(bucketName, {
      allowCloudFront: true,
    });

    const parsed = JSON.parse(policy);
    const cloudFrontStatement = parsed.Statement.find(
      (s: any) => s.Principal?.Service === 'cloudfront.amazonaws.com'
    );
    expect(cloudFrontStatement).toBeDefined();
  });

  it('should create policy with allowed principals', () => {
    const bucketName = 'test-bucket';
    const allowedPrincipals = ['arn:aws:iam::123456789012:user/testuser'];
    const policy = createSecureBucketPolicy(bucketName, {
      allowedPrincipals,
    });

    const parsed = JSON.parse(policy);
    const principalStatement = parsed.Statement.find((s: any) => s.Principal?.AWS);
    expect(principalStatement).toBeDefined();
    expect(principalStatement.Principal.AWS).toEqual(allowedPrincipals);
  });

  it('should create policy with SSL enforcement', () => {
    const bucketName = 'test-bucket';
    const policy = createSecureBucketPolicy(bucketName, {
      enforceSSL: true,
    });

    const parsed = JSON.parse(policy);
    const sslStatement = parsed.Statement.find((s: any) => s.Condition?.StringNotEquals);
    expect(sslStatement).toBeDefined();
  });

  it('should create policy with insecure transport denial', () => {
    const bucketName = 'test-bucket';
    const policy = createSecureBucketPolicy(bucketName, {
      denyInsecureTransport: true,
    });

    const parsed = JSON.parse(policy);
    const insecureStatement = parsed.Statement.find((s: any) => s.Condition?.Bool);
    expect(insecureStatement).toBeDefined();
  });
});

describe('S3 Defaults', () => {
  it('should have secure encryption defaults', () => {
    expect(S3_DEFAULTS.encryption.sseAlgorithm).toBe('AES256');
    expect(S3_DEFAULTS.encryption.bucketKeyEnabled).toBe(true);
  });

  it('should have versioning enabled by default', () => {
    expect(S3_DEFAULTS.versioning.enabled).toBe(true);
    expect(S3_DEFAULTS.versioning.mfaDelete).toBe(false);
  });

  it('should block public access by default', () => {
    expect(S3_DEFAULTS.publicAccessBlock.blockPublicAcls).toBe(true);
    expect(S3_DEFAULTS.publicAccessBlock.blockPublicPolicy).toBe(true);
    expect(S3_DEFAULTS.publicAccessBlock.ignorePublicAcls).toBe(true);
    expect(S3_DEFAULTS.publicAccessBlock.restrictPublicBuckets).toBe(true);
  });

  it('should have secure object ownership defaults', () => {
    expect(S3_DEFAULTS.objectOwnership.objectOwnership).toBe('BucketOwnerPreferred');
  });

  it('should have intelligent lifecycle defaults', () => {
    expect(S3_DEFAULTS.lifecycle).toBeInstanceOf(Array);
    expect(S3_DEFAULTS.lifecycle.length).toBeGreaterThan(0);

    const intelligentTiering = S3_DEFAULTS.lifecycle.find(
      rule => rule.id === 'intelligent-tiering'
    );
    expect(intelligentTiering).toBeDefined();
    expect(intelligentTiering?.enabled).toBe(true);
  });

  it('should have proper default tags', () => {
    expect(S3_DEFAULTS.tags.ManagedBy).toBe('SecureByDesign');
    expect(S3_DEFAULTS.tags.Component).toBe('S3');
    expect(S3_DEFAULTS.tags.SecurityLevel).toBe('high');
  });

  it('should have common S3 events defined', () => {
    expect(S3_DEFAULTS.events.OBJECT_CREATED).toBe('s3:ObjectCreated:*');
    expect(S3_DEFAULTS.events.OBJECT_REMOVED).toBe('s3:ObjectRemoved:*');
  });

  it('should have storage classes defined', () => {
    expect(S3_DEFAULTS.storageClasses.STANDARD).toBe('STANDARD');
    expect(S3_DEFAULTS.storageClasses.GLACIER).toBe('GLACIER');
    expect(S3_DEFAULTS.storageClasses.DEEP_ARCHIVE).toBe('DEEP_ARCHIVE');
  });

  it('should have CORS defaults for web and API', () => {
    expect(S3_DEFAULTS.corsWeb.allowedMethods).toContain('GET');
    expect(S3_DEFAULTS.corsApi.allowedMethods).toContain('POST');
  });
});
