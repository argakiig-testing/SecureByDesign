/**
 * Basic S3 Bucket Example
 *
 * This example demonstrates creating a basic S3 bucket with secure defaults.
 * The bucket will have:
 * - Encryption at rest enabled (AES256)
 * - Versioning enabled
 * - Public access blocked
 * - Intelligent tiering lifecycle rules
 */

import { S3Component } from 'modular-pulumi-aws-framework';

// Create a basic secure S3 bucket
const documentsBucket = new S3Component('documents', {
  name: 'my-company-documents-bucket',
  tags: {
    Environment: 'production',
    Project: 'document-storage',
    Owner: 'platform-team',
  },
});

// Export bucket information
export const bucketName = documentsBucket.bucketName;
export const bucketArn = documentsBucket.bucketArn;
export const bucketDomainName = documentsBucket.bucketDomainName;
