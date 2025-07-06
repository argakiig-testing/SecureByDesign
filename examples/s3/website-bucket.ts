/**
 * Static Website Hosting Example
 *
 * This example demonstrates creating an S3 bucket configured for static website hosting:
 * - Website configuration with index and error documents
 * - CORS rules for web access
 * - Public read access (carefully configured)
 * - CloudFront-friendly settings
 */

import { S3Component } from 'modular-pulumi-aws-framework';

// Create a bucket for static website hosting
const websiteBucket = new S3Component('website', {
  name: 'my-company-website-bucket',

  // Configure for static website hosting
  website: {
    indexDocument: 'index.html',
    errorDocument: 'error.html',
  },

  // CORS configuration for web browsers
  corsRules: [
    {
      id: 'website-cors',
      allowedMethods: ['GET', 'HEAD'],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
      maxAgeSeconds: 3600,
    },
  ],

  // Disable versioning for static websites (optional)
  versioning: {
    enabled: false,
    mfaDelete: false,
  },

  // Simple lifecycle rule for cleanup
  lifecycleRules: [
    {
      id: 'abort-incomplete-uploads',
      enabled: true,
      abortIncompleteMultipartUpload: {
        daysAfterInitiation: 1,
      },
    },
  ],

  // Note: For public website access, you would need to:
  // 1. Set blockPublicAcls: false, blockPublicPolicy: false, etc.
  // 2. Add a bucket policy allowing public read access
  // 3. Or better yet, use CloudFront with Origin Access Control

  tags: {
    Environment: 'production',
    Project: 'company-website',
    Owner: 'marketing-team',
    Purpose: 'static-hosting',
  },
});

// Create a secure policy that allows CloudFront access
// This is the recommended approach instead of making the bucket public
const cloudfrontPolicy = websiteBucket.createSecurePolicy({
  allowCloudFront: true,
  denyInsecureTransport: true,
  enforceSSL: true,
});

// Export website information
export const websiteBucketName = websiteBucket.bucketName;
export const websiteBucketArn = websiteBucket.bucketArn;
export const websiteEndpoint = websiteBucket.websiteEndpoint;
export const websiteDomain = websiteBucket.websiteDomain;
export const websitePolicy = cloudfrontPolicy;
